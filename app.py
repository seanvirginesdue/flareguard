from flask import Flask, Response
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
import shutil

app = Flask(__name__)

# --- Firebase + Supabase setup ---
cred = credentials.Certificate("flareguard-97905-firebase-adminsdk-fbsvc-720e110c23.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

SUPABASE_URL = "https://yzwqboyvxrhfslghfznp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d3Fib3l2eHJoZnNsZ2hmem5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg1NjUyNiwiZXhwIjoyMDczNDMyNTI2fQ.exrUZWtWLOYwid1Ta7PKPc0G4OjGOtk96Z_HBag3sCk"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- YOLO setup ---
model = YOLO("best.pt")
classnames = ['non_fire', 'severe_fire', 'small_fire', 'smoke']
colors = {
    'non_fire': (0, 255, 0),
    'severe_fire': (0, 0, 255),
    'small_fire': (0, 165, 255),
    'smoke': (255, 0, 0)
}

# --- Global settings ---
camera_threads = {}
camera_frames = {}
lock = threading.Lock()

ALERT_HOLD_TIME = 0.5
ALERT_COOLDOWN = 60
FRAME_SKIP = 3  # Process every 3rd frame for performance


# -----------------------------
#  Model auto-reload feature
# -----------------------------
def auto_reload_model(interval=3600):
    def reload_task():
        global model
        while True:
            time.sleep(interval)
            try:
                with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as tmpfile:
                    res = supabase.storage.from_("models").download("best.pt")
                    tmpfile.write(res)
                    tmpfile.flush()
                    model = YOLO(tmpfile.name)
                print("🔁 Reloaded updated YOLO model from Supabase")
            except Exception as e:
                print("Model reload failed:", e)

    threading.Thread(target=reload_task, daemon=True).start()


# -----------------------------
#  Upload functions
# -----------------------------
def _save_self_learning(frame, label_name, conf):
    """Save small_fire and severe_fire detections only"""
    try:
        if label_name not in ["small_fire", "severe_fire"]:
            return

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmpfile:
            filename = f"{label_name}_{int(time.time())}.jpg"
            temp_path = tmpfile.name
            cv2.imwrite(temp_path, frame)

        bucket_name = "self-learning-data"
        with open(temp_path, "rb") as f:
            supabase.storage.from_(bucket_name).upload(
                f"dataset/{label_name}/{filename}",
                f,
                {"content-type": "image/jpeg"}
            )

        print(f"📸 Sent {label_name} ({conf*100:.1f}%) to self-learning-data")
        os.remove(temp_path)
    except Exception as e:
        print("Self-learning upload error:", e)


def upload_alert_image_async(frame, alert_type, confidence, camera_location):
    thread = threading.Thread(
        target=_upload_alert_image_task,
        args=(frame, alert_type, confidence, camera_location),
        daemon=True
    )
    thread.start()


def _upload_alert_image_task(frame, alert_type, confidence, camera_location):
    """Upload alert images asynchronously"""
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmpfile:
            filename = f"{alert_type}_{int(time.time())}.jpg"
            temp_path = tmpfile.name
            cv2.imwrite(temp_path, frame)

        bucket_name = "alert-images"
        with open(temp_path, "rb") as f:
            supabase.storage.from_(bucket_name).upload(filename, f, {"content-type": "image/jpeg"})

        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        db.collection("fire_alerts").add({
            "type": alert_type,
            "confidence": round(confidence, 2),
            "image_url": public_url,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "location": camera_location
        })
        os.remove(temp_path)
        print(f"✅ Uploaded {alert_type} alert to Supabase")
    except Exception as e:
        print("Upload error:", e)


# -----------------------------
#  Camera processing loop
# -----------------------------
def process_camera(camera_id, rtsp_url, latitude, longitude):
    cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)

    fire_detected_start = None
    small_fire_detected_start = None
    alert_active = False
    small_alert_active = False
    frame_count = 0

    CAMERA_LOCATION = {"latitude": latitude, "longitude": longitude}
    print(f"🎥 Started camera stream: {camera_id}")

    while True:
        success, frame = cap.read()
        if not success:
            time.sleep(2)
            continue

        frame_count += 1
        if frame_count % FRAME_SKIP != 0:
            continue

        # Resize to reduce load
        frame = cv2.resize(frame, (640, 480))

        results = model(frame, stream=True, imgsz=480, verbose=False)
        severe_detected = False
        small_fire_detected = False
        severe_confidence = 0.0
        small_confidence = 0.0

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label_name = classnames[cls]
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if conf > 0.6:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), colors[label_name], 2)
                    cvzone.putTextRect(
                        frame,
                        f"{label_name} {conf*100:.1f}%",
                        [x1, y1 - 10],
                        scale=1,
                        thickness=1,
                        colorR=colors[label_name],
                        offset=5
                    )

                    # Save detections for self-learning bucket
                    if label_name in ["small_fire", "severe_fire"]:
                        threading.Thread(
                            target=_save_self_learning,
                            args=(frame.copy(), label_name, conf),
                            daemon=True
                        ).start()

                if label_name == "severe_fire" and conf >= 0.7:
                    severe_detected, severe_confidence = True, conf
                if label_name == "small_fire" and conf >= 0.6:
                    small_fire_detected, small_confidence = True, conf

        current_time = time.time()

        # --- Severe fire logic ---
        if severe_detected and not alert_active and fire_detected_start is None:
            fire_detected_start = current_time
        if fire_detected_start and severe_detected and not alert_active:
            if current_time - fire_detected_start >= ALERT_HOLD_TIME:
                upload_alert_image_async(frame, "severe_fire", severe_confidence, CAMERA_LOCATION)
                db.collection("alerts").add({
                    "type": "severe_fire",
                    "confidence": round(severe_confidence, 2),
                    "timestamp": firestore.SERVER_TIMESTAMP,
                    "location": CAMERA_LOCATION
                })
                alert_active = True
                print(f"🚨 Severe fire alert triggered for {camera_id}")
        if not severe_detected:
            fire_detected_start = None
            alert_active = False

        # --- Small fire logic ---
        if small_fire_detected and not small_alert_active and small_fire_detected_start is None:
            small_fire_detected_start = current_time
        if small_fire_detected_start and small_fire_detected and not small_alert_active:
            if current_time - small_fire_detected_start >= ALERT_HOLD_TIME:
                upload_alert_image_async(frame, "small_fire", small_confidence, CAMERA_LOCATION)
                db.collection("mobile_alerts").add({
                    "type": "small_fire",
                    "confidence": round(small_confidence, 2),
                    "timestamp": firestore.SERVER_TIMESTAMP,
                    "popup": False,
                    "sound": False,
                    "mobile": True,
                    "isRead": False,
                    "readAt": None,
                    "location": CAMERA_LOCATION
                })
                small_alert_active = True
                print(f"🔥 Small fire alert triggered for {camera_id}")

                threading.Timer(ALERT_COOLDOWN, lambda: print(
                    f"Cooldown ended — small fire alert re-enabled for {camera_id}"
                )).start()

        if not small_fire_detected:
            small_fire_detected_start = None

        with lock:
            camera_frames[camera_id] = frame


# -----------------------------
#  Video stream endpoint
# -----------------------------
@app.route('/video_feed<camera_id>')
def video_feed(camera_id):
    def generate():
        while True:
            with lock:
                frame = camera_frames.get(camera_id)
            if frame is not None:
                _, buffer = cv2.imencode('.jpg', frame)
                yield (
                    b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' +
                    buffer.tobytes() + b'\r\n'
                )
            else:
                time.sleep(0.1)

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


# -----------------------------
#  Firestore camera watcher
# -----------------------------
def watch_cameras():
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            doc_id = change.document.id
            data = change.document.to_dict()
            if change.type.name == "ADDED":
                url = data.get("url")
                latitude = data.get("latitude", "")
                longitude = data.get("longitude", "")
                if url and doc_id not in camera_threads:
                    thread = threading.Thread(
                        target=process_camera,
                        args=(doc_id, url, latitude, longitude),
                        daemon=True
                    )
                    camera_threads[doc_id] = thread
                    thread.start()
                    print(f"Camera added: {url}")
            elif change.type.name == "REMOVED":
                if doc_id in camera_threads:
                    print(f"Camera removed: {doc_id}")
                    del camera_threads[doc_id]
                    with lock:
                        camera_frames.pop(doc_id, None)

    db.collection("cameras").on_snapshot(on_snapshot)


# -----------------------------
#  Run the app
# -----------------------------
if __name__ == "__main__":
    auto_reload_model(3600)
    watch_cameras()
    app.run(host="0.0.0.0", port=5000, threaded=True)
