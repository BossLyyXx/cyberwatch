import os
import io
import cv2
import base64
import pickle
import requests
import numpy as np
from typing import List, Optional, Dict, Any, Tuple
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ----------------------------
# Config
# ----------------------------
DEFAULT_THRESHOLD = float(os.getenv("MATCH_THRESHOLD", "0.5"))  # ยิ่งต่ำยิ่งเข้มงวด
CACHE_PATH = os.getenv("WATCHLIST_CACHE", "watchlist.pkl")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# ----------------------------
# App
# ----------------------------
app = FastAPI(title="CYBERWATCH Face Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Face utils (face_recognition)
# ----------------------------
try:
    import face_recognition  # ต้องมี dlib ใต้ท้อง
except Exception as e:
    raise RuntimeError(
        "ต้องติดตั้งแพ็กเกจ 'face_recognition' ก่อน (มี dlib) เช่นบน Windows ใช้ wheel สำเร็จรูป) : "
        f"{e}"
    )

def _bgr2rgb(img_bgr: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

def load_image_from_bytes(raw: bytes) -> np.ndarray:
    nparr = np.frombuffer(raw, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("ไม่สามารถอ่านรูปจากไบต์ได้")
    return _bgr2rgb(img_bgr)

def load_image_from_base64(data_url: str) -> np.ndarray:
    """
    รองรับทั้ง pure base64 และ data URL (เช่น 'data:image/jpeg;base64,...')
    """
    if "," in data_url and data_url.strip().startswith("data:"):
        base64_str = data_url.split(",", 1)[1]
    else:
        base64_str = data_url
    raw = base64.b64decode(base64_str)
    return load_image_from_bytes(raw)

def load_image_from_url(url: str, timeout: int = 15) -> np.ndarray:
    r = requests.get(url, timeout=timeout)
    r.raise_for_status()
    return load_image_from_bytes(r.content)

def face_encodings_from_image(img_rgb: np.ndarray) -> Tuple[List[Tuple[int,int,int,int]], List[np.ndarray]]:
    """
    คืน (locations, encodings)
    locations: list of (top, right, bottom, left)
    """
    boxes = face_recognition.face_locations(img_rgb, model="hog")  # "cnn" แม่นกว่าแต่ช้ากว่า
    if not boxes:
        return [], []
    encs = face_recognition.face_encodings(img_rgb, boxes)
    return boxes, encs

# ----------------------------
# Watchlist store (in-memory + cache)
# ----------------------------
class WatchlistEntryIn(BaseModel):
    id: str
    name: str
    image_urls: Optional[List[str]] = None
    image_base64: Optional[List[str]] = None
    meta: Optional[Dict[str, Any]] = None

class WatchlistEntryOut(BaseModel):
    id: str
    name: str
    images: int
    meta: Optional[Dict[str, Any]] = None
    first_image_base64: Optional[str] = None # เพิ่ม field นี้เข้ามา

WATCHLIST: List[Dict[str, Any]] = []

def save_cache():
    try:
        serializable = []
        for item in WATCHLIST:
            serializable.append({
                "id": item["id"],
                "name": item["name"],
                "meta": item.get("meta"),
                "encodings": [enc.astype(np.float32) for enc in item["encodings"]],
                "first_image_base64": item.get("first_image_base64"), # เพิ่ม field นี้
            })
        with open(CACHE_PATH, "wb") as f:
            pickle.dump(serializable, f)
    except Exception as e:
        print("WARN: save_cache failed:", e)

def load_cache():
    global WATCHLIST
    if not os.path.exists(CACHE_PATH):
        return
    try:
        with open(CACHE_PATH, "rb") as f:
            data = pickle.load(f)
        WATCHLIST = []
        for row in data:
            WATCHLIST.append({
                "id": row["id"],
                "name": row["name"],
                "meta": row.get("meta"),
                "encodings": [np.array(enc, dtype=np.float32) for enc in row["encodings"]],
                "first_image_base64": row.get("first_image_base64"), # เพิ่ม field นี้
            })
        print(f"Loaded watchlist cache: {len(WATCHLIST)} people")
    except Exception as e:
        print("WARN: load_cache failed:", e)

load_cache()

# ----------------------------
# API
# ----------------------------
@app.get("/health")
def health():
    return {"status": "ok", "watchlist_size": len(WATCHLIST)}

@app.get("/watchlist", response_model=List[WatchlistEntryOut])
def get_watchlist():
    out = []
    for item in WATCHLIST:
        out.append(WatchlistEntryOut(
            id=item["id"],
            name=item["name"],
            images=len(item["encodings"]),
            meta=item.get("meta"),
            first_image_base64=item.get("first_image_base64") # เพิ่ม field นี้
        ))
    return out

@app.post("/watchlist/sync")
def sync_watchlist(
    entries: List[WatchlistEntryIn],
    replace: bool = True
):
    global WATCHLIST
    if replace:
        WATCHLIST = []

    added, failed = 0, []
    for e in entries:
        images = []
        first_image_base64_for_entry = None # เก็บ base64 รูปแรก

        try:
            if e.image_urls:
                for u in e.image_urls:
                    try:
                        img_bytes = requests.get(u, timeout=15).content
                        images.append(load_image_from_bytes(img_bytes))
                        if not first_image_base64_for_entry: # เก็บรูปแรก
                            first_image_base64_for_entry = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode('utf-8')
                    except Exception as exu:
                        failed.append({"id": e.id, "name": e.name, "error": f"image_url:{u} -> {exu}"})
            if e.image_base64:
                for b64 in e.image_base64:
                    try:
                        images.append(load_image_from_base64(b64))
                        if not first_image_base64_for_entry: # เก็บรูปแรก
                            first_image_base64_for_entry = b64 if b64.startswith("data:") else f"data:image/jpeg;base64,{b64}"
                    except Exception as exb:
                        failed.append({"id": e.id, "name": e.name, "error": f"image_base64 -> {exb}"})
            encodings = []
            for img in images:
                _, encs = face_encodings_from_image(img)
                encodings.extend(encs)
            if not encodings:
                failed.append({"id": e.id, "name": e.name, "error": "no face found"})
                continue

            WATCHLIST.append({
                "id": e.id,
                "name": e.name,
                "meta": e.meta or {},
                "encodings": encodings,
                "first_image_base64": first_image_base64_for_entry, # เพิ่ม field นี้
            })
            added += 1
        except Exception as ex:
            failed.append({"id": e.id, "name": e.name, "error": str(ex)})

    save_cache()
    return {"added": added, "failed": failed, "total": len(WATCHLIST)}

@app.delete("/watchlist/{person_id}", status_code=204)
def delete_person(person_id: str):
    global WATCHLIST
    initial_len = len(WATCHLIST)
    WATCHLIST = [p for p in WATCHLIST if p.get("id") != person_id]
    if len(WATCHLIST) == initial_len:
        raise HTTPException(status_code=404, detail=f"Person with id '{person_id}' not found")
    save_cache()
    return

@app.post("/match")
async def match(
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    threshold: Optional[float] = Form(None),
):
    if not WATCHLIST:
        raise HTTPException(status_code=400, detail="Watchlist ว่าง กรุณาเรียก /watchlist/sync ก่อน")

    img = None
    file_name = None
    final_threshold = threshold if threshold is not None else DEFAULT_THRESHOLD

    if image:
        raw_img = await image.read()
        img = load_image_from_bytes(raw_img)
        file_name = image.filename
    elif image_base64:
        img = load_image_from_base64(image_base64)
        file_name = "base64"
    else:
        raise HTTPException(status_code=400, detail="ต้องส่งไฟล์ image หรือ image_base64")

    boxes, encs = face_encodings_from_image(img)
    results = []
    for box, enc in zip(boxes, encs):
        best_name, best_id, best_dist = "unknown", None, 1.0
        for person in WATCHLIST:
            dists = face_recognition.face_distance(person["encodings"], enc)
            min_dist = float(np.min(dists)) if len(dists) else 1.0
            if min_dist < best_dist:
                best_dist = min_dist
                best_name = person["name"]
                best_id = person["id"]
        
        matched = bool(best_dist <= final_threshold)
        results.append({
            "box": {"top": box[0], "right": box[1], "bottom": box[2], "left": box[3]},
            "matched": matched,
            "name": best_name if matched else "unknown",
            "id": best_id if matched else None,
            "distance": round(best_dist, 4),
            "threshold": final_threshold,
        })

    return {
        "file": file_name,
        "faces": len(results),
        "results": results,
    }

# ----------------------------
# Local dev
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))