"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

interface FireAlert {
  id: string;
  type?: string;
  image_url?: string;
  location?: {
    address?: string;
    latitude?: string;
    longitude?: string;
  };
  timestamp?: any;
  popup?: boolean;
  sound?: boolean;
  status?: string;
}

export default function FireAlerts() {
  const [alerts, setAlerts] = useState<FireAlert[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<FireAlert | null>(null);
  const [audio] = useState<HTMLAudioElement>(
    typeof Audio !== "undefined" ? new Audio("/alert.mp3") : (null as any)
  );

  useEffect(() => {
    const q = query(collection(db, "fire_alerts"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as FireAlert)
      );
      setAlerts(newAlerts);

      if (newAlerts.length > 0) {
        const latest = newAlerts[0];
        if (
          (latest.popup || latest.type === "severe_fire") &&
          latest.status !== "resolved" &&
          latest.status !== "acknowledged"
        ) {
          setActiveAlert(latest);
          if (audio) {
            audio.loop = true;
            audio.play().catch((err) =>
              console.warn("Audio play failed:", err)
            );
          }
        }
      }
    });

    return () => unsub();
  }, []);

  const acknowledgeAlert = async (alert: FireAlert) => {
    try {
      await updateDoc(doc(db, "fire_alerts", alert.id), {
        status: "acknowledged",
      });

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      setActiveAlert(null);
      setMessage("Alert acknowledged");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      setMessage("Failed to acknowledge alert");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resolveAlert = async (alert: FireAlert) => {
    const confirmed = confirm(
      "Are you sure you want to resolve this alert?"
    );
    if (!confirmed) return;

    const actionsTaken = prompt("Enter actions taken (optional):", "");

    try {
      await addDoc(collection(db, "logs"), {
        ...alert,
        loggedAt: Date.now(),
        status: "resolved",
        actionsTaken: actionsTaken || "No details provided",
      });
      await updateDoc(doc(db, "fire_alerts", alert.id), { status: "resolved" });

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      setMessage("Alert marked as resolved");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error resolving alert:", error);
      setMessage("Failed to resolve alert");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const viewOnMap = (alert: FireAlert) => {
    const lat = alert.location?.latitude;
    const lng = alert.location?.longitude;
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    } else {
      setMessage("Location coordinates not available");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-red-50 via-white to-orange-50 rounded-2xl shadow-lg border border-red-100/70">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Fire Alerts & Notifications
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Monitor real-time fire events, acknowledge incidents, and resolve alerts.
          </p>
        </div>
        <span className="inline-flex items-center self-start rounded-full border border-red-100 bg-white/70 px-3 py-1 text-xs font-medium text-red-700 shadow-sm">
          Active alerts:{" "}
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {alerts.filter((a) => a.status !== "resolved").length}
          </span>
        </span>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-center shadow-sm text-sm border border-emerald-100">
          {message}
        </div>
      )}

      {/* 🔥 Active Alert Modal */}
      {activeAlert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-white px-6 py-5 sm:px-8 sm:py-6 rounded-2xl shadow-2xl text-center w-full max-w-md border border-red-100">
            <h2 className="text-xl sm:text-2xl font-extrabold text-red-600 mb-3 tracking-wide">
              SEVERE FIRE DETECTED!
            </h2>
            {activeAlert.image_url && (
              <img
                src={activeAlert.image_url}
                alt={activeAlert.type || "fire alert"}
                className="w-full h-40 sm:h-48 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-800 font-semibold mb-2 capitalize">
              {activeAlert.type?.replace("_", " ") || "Unknown type"}
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {activeAlert.location?.address || "VIEW LOGS AND REPORTS"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => acknowledgeAlert(activeAlert)}
                className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 active:scale-95 transition-transform shadow-md"
              >
                Acknowledge
              </button>
              <button
                onClick={() => resolveAlert(activeAlert)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-transform shadow-md"
              >
                Resolve
              </button>
              <button
                onClick={() => viewOnMap(activeAlert)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition-transform shadow-md"
              >
                View on Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Table Section */}
      <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white/80 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm sm:text-base">
          <thead className="bg-red-50/80 hidden sm:table-header-group">
            <tr>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Image</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Type</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Location</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Timestamp</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-gray-600">
            {alerts.length > 0 ? (
              alerts.map((a) => (
                <tr
                  key={a.id}
                  className={`block sm:table-row border sm:border-0 rounded-xl sm:rounded-none mb-4 sm:mb-0 transition-colors ${
                    a.status === "resolved"
                      ? "bg-gray-50 text-gray-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 sm:px-6 py-3 align-top">
                    {a.image_url ? (
                      <img
                        src={a.image_url}
                        alt={a.type || "alert"}
                        className="w-full sm:w-24 sm:h-24 h-40 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-full sm:w-24 h-24 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500 text-sm border border-dashed border-gray-300">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="block sm:table-cell px-4 sm:px-6 py-2 capitalize font-semibold">
                    {a.type?.replace("_", " ") || "Unknown"}
                  </td>
                  <td className="block sm:table-cell px-4 sm:px-6 py-2 text-sm sm:text-base">
                    {a.location?.address || "Mexico, Central Luzon"}
                  </td>
                  <td className="block sm:table-cell px-4 sm:px-6 py-2">
                    {a.timestamp?.seconds
                      ? new Date(a.timestamp.seconds * 1000).toLocaleString()
                      : "No timestamp"}
                  </td>
                  <td className="block sm:table-cell px-4 sm:px-6 py-2">
                    {a.status === "resolved" ? (
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
                        Resolved
                      </span>
                    ) : a.status === "acknowledged" ? (
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200">
                        Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="block sm:table-cell px-4 sm:px-6 py-3">
                    {a.status !== "resolved" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => resolveAlert(a)}
                          className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => viewOnMap(a)}
                          className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-sm"
                        >
                          Map
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 sm:px-6 py-6 text-center text-gray-500 text-sm"
                >
                  No fire alerts at the moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
