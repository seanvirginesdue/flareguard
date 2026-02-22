import os, tempfile, shutil, random, time
from ultralytics import YOLO
from supabase import create_client, Client
import cv2
import numpy as np

# --- Supabase setup ---
SUPABASE_URL = "https://yzwqboyvxrhfslghfznp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d3Fib3l2eHJoZnNsZ2hmem5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg1NjUyNiwiZXhwIjoyMDczNDMyNTI2fQ.exrUZWtWLOYwid1Ta7PKPc0G4OjGOtk96Z_HBag3sCk"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Config ---
BUCKET = "self-learning-data"
DATASET_PATH = "dataset"
CLASSES = ["small_fire", "severe_fire"]
MIN_SAMPLES = 50
EPOCHS = 10

def download_new_images(tmpdir):
    print("📥 Downloading new raw images from Supabase folders...")
    downloaded = []

    # Loop through each class folder in the dataset
    for label in CLASSES:
        folder_path = f"{DATASET_PATH}/{label}"
        files = supabase.storage.from_(BUCKET).list(folder_path)
        label_dir = os.path.join(tmpdir, label)
        os.makedirs(label_dir, exist_ok=True)

        for f in files:
            name = f["name"]
            if not name.endswith(".jpg"):
                continue
            local_path = os.path.join(label_dir, os.path.basename(name))
            with open(local_path, "wb") as out:
                out.write(supabase.storage.from_(BUCKET).download(name))
            downloaded.append((local_path, label))  # include label info

    print(f"✅ Downloaded {len(downloaded)} images total")
    return downloaded

def auto_label_images(model, labeled_imgs, label_dir):
    os.makedirs(label_dir, exist_ok=True)
    labeled = []

    for img_path, true_label in labeled_imgs:
        results = model.predict(img_path, verbose=False)
        boxes = results[0].boxes
        base = os.path.splitext(os.path.basename(img_path))[0]
        txt_path = os.path.join(label_dir, base + ".txt")

        if len(boxes) == 0:
            # If no prediction, label based on folder (true_label)
            cls_idx = CLASSES.index(true_label)
            with open(txt_path, "w") as f:
                f.write(f"{cls_idx} 0.5 0.5 1.0 1.0\n")  # full-frame pseudo-box
            labeled.append(img_path)
            continue

        with open(txt_path, "w") as f:
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                if conf < 0.5:
                    continue
                x1, y1, x2, y2 = map(float, box.xyxy[0])
                img = cv2.imread(img_path)
                h, w = img.shape[:2]
                x = ((x1 + x2) / 2) / w
                y = ((y1 + y2) / 2) / h
                bw = (x2 - x1) / w
                bh = (y2 - y1) / h
                f.write(f"{cls} {x:.6f} {y:.6f} {bw:.6f} {bh:.6f}\n")

        labeled.append(img_path)
    print(f"🧾 Auto-labeled {len(labeled)} images")
    return labeled

def verify_images(imgs, label_dir):
    print("👀 Verification step — press 'y' to accept, any key to skip")
    verified = []
    for img_path in imgs:
        img = cv2.imread(img_path)
        base = os.path.splitext(os.path.basename(img_path))[0]
        txt_path = os.path.join(label_dir, base + ".txt")
        if not os.path.exists(txt_path):
            continue
        with open(txt_path) as f:
            for line in f:
                cls, x, y, w, h = map(float, line.split())
                img_h, img_w = img.shape[:2]
                x1 = int((x - w/2) * img_w)
                y1 = int((y - h/2) * img_h)
                x2 = int((x + w/2) * img_w)
                y2 = int((y + h/2) * img_h)
                cv2.rectangle(img, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(img, CLASSES[int(cls)], (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
        cv2.imshow("verify", img)
        key = cv2.waitKey(0)
        cv2.destroyAllWindows()
        if key == ord('y'):
            verified.append(img_path)
    print(f"✅ Verified {len(verified)} samples")
    return verified

def retrain_and_upload(verified_imgs, label_dir):
    if len(verified_imgs) < MIN_SAMPLES:
        print(f"❌ Not enough verified samples ({len(verified_imgs)} < {MIN_SAMPLES})")
        return

    print("📚 Preparing dataset...")
    tmp = tempfile.mkdtemp()
    imgs_train = os.path.join(tmp, "images", "train")
    imgs_val = os.path.join(tmp, "images", "val")
    os.makedirs(imgs_train, exist_ok=True)
    os.makedirs(imgs_val, exist_ok=True)
    labels_train = imgs_train.replace("images", "labels")
    labels_val = imgs_val.replace("images", "labels")
    os.makedirs(labels_train, exist_ok=True)
    os.makedirs(labels_val, exist_ok=True)

    random.shuffle(verified_imgs)
    split = int(0.8 * len(verified_imgs))
    for i, p in enumerate(verified_imgs):
        dest_img = imgs_train if i < split else imgs_val
        dest_lbl = labels_train if i < split else labels_val
        shutil.copy(p, dest_img)
        lbl = os.path.join(label_dir, os.path.splitext(os.path.basename(p))[0] + ".txt")
        shutil.copy(lbl, dest_lbl)

    yaml_path = os.path.join(tmp, "data.yaml")
    with open(yaml_path, "w") as f:
        f.write("train: " + imgs_train + "\n")
        f.write("val: " + imgs_val + "\n")
        f.write("names: ['small_fire','severe_fire']\n")

    print("🚀 Training new YOLO model...")
    model = YOLO("best.pt")
    model.train(data=yaml_path, epochs=EPOCHS, imgsz=640)
    best = "runs/detect/train/weights/best.pt"

    if os.path.exists(best):
        print("⬆️ Uploading new model to Supabase...")
        with open(best, "rb") as f:
            supabase.storage.from_("models").upload("best.pt", f)
        print("✅ Model updated successfully in Supabase!")
    else:
        print("❌ Training failed — no best.pt found.")

def main():
    tmpdir = tempfile.mkdtemp()
    try:
        images = download_new_images(tmpdir)
        if not images:
            print("No new images found.")
            return
        base_model = YOLO("best.pt")
        labeled = auto_label_images(base_model, images, os.path.join(tmpdir, "labels"))
        verified = verify_images(labeled, os.path.join(tmpdir, "labels"))
        retrain_and_upload(verified, os.path.join(tmpdir, "labels"))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

if __name__ == "__main__":
    main()
