"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import Alerts from "./Alerts";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

interface Camera {
  id: string;
  url: string;
  latitude?: string;
  longitude?: string;
}

const MAX_CAMERAS = 4;
const RTSP_PATTERN = /^rtsp:\/\/.+/i;

function isValidCoordinate(value: string, min: number, max: number): boolean {
  const n = parseFloat(value);
  return !isNaN(n) && n >= min && n <= max;
}

export default function Video() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "cameras"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Camera[] = snapshot.docs.map((d) => ({
        id: d.id,
        url: d.data().url as string,
        latitude: d.data().latitude as string | undefined,
        longitude: d.data().longitude as string | undefined,
      }));
      setCameras(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addCamera = async () => {
    setAddError(null);

    if (!newUrl.trim() || !RTSP_PATTERN.test(newUrl.trim())) {
      setAddError("Enter a valid RTSP URL (e.g. rtsp://ip:port/stream).");
      return;
    }
    if (!isValidCoordinate(latitude, -90, 90)) {
      setAddError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (!isValidCoordinate(longitude, -180, 180)) {
      setAddError("Longitude must be a number between -180 and 180.");
      return;
    }
    if (cameras.length >= MAX_CAMERAS) {
      setAddError(`Maximum ${MAX_CAMERAS} cameras allowed.`);
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cameras/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          latitude: latitude.trim(),
          longitude: longitude.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error ?? "Failed to add camera.");
        return;
      }

      setNewUrl("");
      setLatitude("");
      setLongitude("");
      setShowAddModal(false);
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const deleteCamera = async (id: string) => {
    if (!confirm("Delete this camera?")) return;
    try {
      await deleteDoc(doc(db, "cameras", id));
    } catch {
      console.error("Failed to delete camera");
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setAddError(null);
    setNewUrl("");
    setLatitude("");
    setLongitude("");
  };

  const gridSlots = Array.from({ length: MAX_CAMERAS }, (_, i) => cameras[i] ?? null);

  return (
    <div className="p-6 md:p-7 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl shadow-lg border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Live Video Feed
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor real-time streams from your connected cameras.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 transition"
        >
          <Plus size={16} />
          <span>Add camera</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        {gridSlots.map((camera, i) =>
          camera ? (
            <div
              key={camera.id}
              className="relative bg-gray-100 rounded-xl shadow-md overflow-hidden border border-gray-200/80 hover:border-blue-400/60 hover:shadow-lg transition"
            >
              {/* Route stream through Next.js API proxy, not directly to Flask */}
              <img
                src={`/api/cameras/stream/${camera.id}`}
                alt={`Camera ${i + 1}`}
                className="w-full aspect-video object-cover cursor-pointer bg-black"
                onClick={() => setSelectedVideo(`/api/cameras/stream/${camera.id}`)}
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white text-xs sm:text-sm px-3 py-2 flex justify-between items-end">
                <div>
                  <span className="font-semibold">Camera {i + 1}</span>
                  {camera.latitude && camera.longitude && (
                    <p className="text-[11px] sm:text-xs text-gray-300">
                      {camera.latitude}, {camera.longitude}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Delete camera ${i + 1}`}
                  onClick={() => deleteCamera(camera.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-red-300 hover:text-red-100 hover:bg-red-600/80 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center bg-white/70 border-2 border-dashed border-gray-300 rounded-xl aspect-video cursor-pointer hover:bg-blue-50 hover:border-blue-400/70 transition group"
            >
              <div className="flex flex-col items-center gap-1 text-gray-500">
                <Plus className="group-hover:text-blue-600" size={32} />
                <span className="text-xs font-medium group-hover:text-blue-700">
                  Add camera slot
                </span>
              </div>
            </button>
          )
        )}
      </div>

      {/* Fullscreen video modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full p-4">
            <button
              type="button"
              aria-label="Close video"
              className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white text-2xl font-bold hover:bg-red-600 transition"
              onClick={() => setSelectedVideo(null)}
            >
              &times;
            </button>
            <img
              src={selectedVideo}
              alt="Enlarged video"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Add RTSP Camera</h3>
            <p className="text-xs text-gray-500 mb-4">
              Supports RTSP URLs from compatible IP cameras. Up to {MAX_CAMERAS} cameras.
            </p>

            {addError && (
              <div role="alert" className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {addError}
              </div>
            )}

            <input
              type="text"
              placeholder="rtsp://ip:port/stream"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />
            <input
              type="number"
              placeholder="Latitude (−90 to 90)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              min={-90}
              max={90}
              step="any"
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />
            <input
              type="number"
              placeholder="Longitude (−180 to 180)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              min={-180}
              max={180}
              step="any"
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-4 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCamera}
                disabled={adding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-6 text-center text-gray-500">Loading cameras...</div>
      )}

      <div className="mt-10">
        <Alerts />
      </div>
    </div>
  );
}
