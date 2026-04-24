from flask import Flask, Response, jsonify
import cv2
from ultralytics import YOLO
import cvzone
import time
import threading
import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client, Client
import os
import tempfile
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Firebase initialisation — credentials come from env, never from a file
# ---------------------------------------------------------------------------
def _init_firebase():
    if firebase_admin._apps:
        return
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON env var is required")
    cred = credentials.Certificate(json.loads(raw))
    firebase_admin.initialize_app(cred)

_init_firebase()
db = firestore.client()

# ---------------------------------------------------------------------------
# Supabase — credentials from env
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------------------------------------------------------
# YOLO model — download from Supabase on first run if not cached
# ---------------------------------------------------------------------------
MODEL_PATH = os.environ.get("MODEL_PATH", "best.pt")

def ensure_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading YOLO model from Supabase storage...")
        data = supabase.storage.from_("models").download("best.pt")
        with open(MODEL_PATH, "wb") as f:
            f.write(data)
        print("Model downloaded.")

ensure_model()
model = YOLO(MODEL_PATH)

classnames = ["non_fire", "severe_fire", "small_fire", "smoke"]
colors = {
    "non_fire":    (0, 255, 0),
    "severe_fire": (0, 0, 255),
    "small_fire":  (0, 165, 255),
    "smoke":       (255, 0, 0),
}

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
camera_threads: dict = {}
camera_frames: dict = {}
lock = threading.Lock()

ALERT_HOLD_TIME = 0.5
ALERT_COOLDOWN  = 60
FRAME_SKIP      = 3


# ---------------------------------------------------------------------------
# Model auto-reload
# ---------------------------------------------------------------------------
def auto_reload_model(interval: int = 3600):
    def _task():
        global model
        while True:
            time.sleep(interval)
            try:
                data = supabase.storage.from_("models").download("best.pt")
                with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as tmp:
                    tmp.write(data)
                    tmp_path = tmp.name
                model = YOLO(tmp_path)
                os.remove(tmp_path)
                print("YOLO model reloaded from Supabase")
            except Exception as exc:
                print("Model reload failed:", exc)

    threading.Thread(target=_task, daemon=True).start()


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------
def _save_self_learning(frame, label_name: str, conf: float):
    if label_name not in ("small_fire", "severe_fire"):
        return
    try:
        filename = f"{label_name}_{int(conf * 100):03d}conf_{int(time.time())}.jpg"
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, frame)
            tmp_path = tmp.name
        with open(tmp_path, "rb") as f:
            supabase.storage.from_("self-learning-data").upload(
                f"dataset/{label_name}/{filename}", f, {"content-type": "image/jpeg"}
            )
        os.remove(tmp_path)
    except Exception as exc:
        print("Self-learning upload error:", exc)


def _upload_alert_image_task(frame, alert_type: str, confidence: float, location: dict):
    try:
        filename = f"{alert_type}_{int(time.time())}.jpg"
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, frame)
            tmp_path = tmp.name
        with open(tmp_path, "rb") as f:
            supabase.storage.from_("alert-images").upload(filename, f, {"content-type": "image/jpeg"})
        public_url = supabase.storage.from_("alert-images").get_public_url(filename)
        db.collection("fire_alerts").add({
            "type":       alert_type,
            "confidence": round(confidence, 2),
            "image_url":  public_url,
            "timestamp":  firestore.SERVER_TIMESTAMP,
            "location":   location,
            "popup":      alert_type == "severe_fire",
            "status":     "active",
        })
        os.remove(tmp_path)
        print(f"Uploaded {alert_type} alert")
    except Exception as exc:
        print("Upload error:", exc)


def upload_alert_image_async(frame, alert_type: str, confidence: float, location: dict):
    threading.Thread(
        target=_upload_alert_image_task,
        args=(frame.copy(), alert_type, confidence, location),
        daemon=True,
    ).start()


# ---------------------------------------------------------------------------
# Camera processing loop
# ---------------------------------------------------------------------------
def process_camera(camera_id: str, rtsp_url: str, latitude: str, longitude: str):
    cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)

    fire_start = small_fire_start = None
    alert_active = small_alert_active = False
    frame_count = 0
    location = {"latitude": latitude, "longitude": longitude}

    print(f"Started camera stream: {camera_id}")

    while True:
        ok, frame = cap.read()
        if not ok:
            time.sleep(2)
            cap.release()
            cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)
            continue

        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            with lock:
                if camera_id not in camera_frames:
                    camera_frames[camera_id] = frame
            continue

        frame = cv2.resize(frame, (640, 480))
        results = model(frame, stream=True, imgsz=480, verbose=False)

        severe_detected = small_fire_detected = False
        severe_conf = small_conf = 0.0

        for result in results:
            for box in result.boxes:
                conf       = float(box.conf[0])
                cls        = int(box.cls[0])
                label_name = classnames[cls]
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if conf > 0.6:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), colors[label_name], 2)
                    cvzone.putTextRect(
                        frame,
                        f"{label_name} {conf * 100:.1f}%",
                        [x1, max(y1 - 10, 10)],
                        scale=1, thickness=1,
                        colorR=colors[label_name], offset=5,
                    )
                    if label_name in ("small_fire", "severe_fire"):
                        threading.Thread(
                            target=_save_self_learning,
                            args=(frame.copy(), label_name, conf),
                            daemon=True,
                        ).start()

                if label_name == "severe_fire" and conf >= 0.7:
                    severe_detected, severe_conf = True, conf
                if label_name == "small_fire" and conf >= 0.6:
                    small_fire_detected, small_conf = True, conf

        now = time.time()

        # Severe fire
        if severe_detected:
            if fire_start is None:
                fire_start = now
            if not alert_active and now - fire_start >= ALERT_HOLD_TIME:
                upload_alert_image_async(frame, "severe_fire", severe_conf, location)
                db.collection("alerts").add({
                    "type": "severe_fire",
                    "confidence": round(severe_conf, 2),
                    "timestamp": firestore.SERVER_TIMESTAMP,
                    "location": location,
                })
                alert_active = True
        else:
            fire_start = None
            alert_active = False

        # Small fire
        if small_fire_detected:
            if small_fire_start is None:
                small_fire_start = now
            if not small_alert_active and now - small_fire_start >= ALERT_HOLD_TIME:
                upload_alert_image_async(frame, "small_fire", small_conf, location)
                db.collection("mobile_alerts").add({
                    "type":      "small_fire",
                    "confidence": round(small_conf, 2),
                    "timestamp": firestore.SERVER_TIMESTAMP,
                    "popup":     False,
                    "sound":     False,
                    "mobile":    True,
                    "isRead":    False,
                    "readAt":    None,
                    "location":  location,
                })
                small_alert_active = True
                threading.Timer(
                    ALERT_COOLDOWN, lambda: globals().update(small_alert_active=False)
                ).start()
        else:
            small_fire_start = None

        with lock:
            camera_frames[camera_id] = frame


# ---------------------------------------------------------------------------
# Firestore camera watcher
# ---------------------------------------------------------------------------
def watch_cameras():
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            doc_id = change.document.id
            data   = change.document.to_dict()
            if change.type.name == "ADDED":
                url = data.get("url", "")
                if url and doc_id not in camera_threads:
                    t = threading.Thread(
                        target=process_camera,
                        args=(doc_id, url, data.get("latitude", ""), data.get("longitude", "")),
                        daemon=True,
                    )
                    camera_threads[doc_id] = t
                    t.start()
                    print(f"Camera added: {doc_id}")
            elif change.type.name == "REMOVED":
                camera_threads.pop(doc_id, None)
                with lock:
                    camera_frames.pop(doc_id, None)
                print(f"Camera removed: {doc_id}")

    db.collection("cameras").on_snapshot(on_snapshot)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/health")
def health():
    return jsonify({"status": "ok", "cameras": len(camera_threads)}), 200


@app.route("/video_feed/<camera_id>")
def video_feed(camera_id: str):
    # Basic ID validation — only alphanumeric and hyphens
    if not camera_id.replace("-", "").isalnum():
        return jsonify({"error": "Invalid camera ID"}), 400

    def generate():
        while True:
            with lock:
                frame = camera_frames.get(camera_id)
            if frame is not None:
                _, buf = cv2.imencode(".jpg", frame)
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
            else:
                time.sleep(0.05)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


# ---------------------------------------------------------------------------
# Startup — safe to call at module level (gunicorn imports this module once)
# ---------------------------------------------------------------------------
auto_reload_model(3600)
watch_cameras()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)
