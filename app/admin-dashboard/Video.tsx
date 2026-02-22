"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import Alerts from "./Alerts";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
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

export default function Video() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const BACKEND_URL = "http://127.0.0.1:5000";

  
  useEffect(() => {
    const q = query(collection(db, "cameras"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      setCameras(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  
  const addCamera = async () => {
    if (!newUrl.trim()) return alert("Please enter an RTSP URL.");
    if (!latitude.trim() || !longitude.trim())
      return alert("Please enter both latitude and longitude.");
    if (cameras.length >= 4) return alert("Maximum 4 cameras allowed.");

    await addDoc(collection(db, "cameras"), {
      url: newUrl.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      createdAt: serverTimestamp(),
    });

    setNewUrl("");
    setLatitude("");
    setLongitude("");
    setShowAddModal(false);
  };

  
  const deleteCamera = async (id: string) => {
    if (!confirm("Delete this camera?")) return;
    await deleteDoc(doc(db, "cameras", id));
  };

  const gridSlots = Array.from({ length: 4 }, (_, i) => cameras[i] || null);

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
              <img
                src={`${BACKEND_URL}/video_feed${camera.id}`}
                alt={`Camera ${i + 1}`}
                className="w-full aspect-video object-cover cursor-pointer bg-black"
                onClick={() => setSelectedVideo(`${BACKEND_URL}/video_feed${camera.id}`)}
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

     
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full p-4">
            <button
              className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white text-2xl font-bold hover:bg-red-600 hover:text-white transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Add RTSP Camera
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Supports RTSP URLs from compatible IP cameras. Up to 4 cameras can be monitored.
            </p>
            <input
              type="text"
              placeholder="rtsp://username:password@ip:port/stream"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />
            <input
              type="text"
              placeholder="Latitude (e.g. 14.5995)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />
            <input
              type="text"
              placeholder="Longitude (e.g. 120.9842)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="text-gray-700 w-full border rounded-lg p-2.5 mb-4 focus:ring-2 focus:ring-blue-500 outline-none focus:border-blue-400 text-sm"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-gray-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addCamera}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm"
              >
                Add
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
