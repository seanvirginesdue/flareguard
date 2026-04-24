"use client";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Flame,
  MapPin,
  Archive,
  Search,
  Filter,
} from "lucide-react";

interface Log {
  id: string;
  type: string;
  confidence?: number;
  image_url?: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  loggedAt?: number;
  timestamp?: any;
  archived?: boolean;
}

interface Report {
  id: string;
  reporterName: string;
  description: string;
  severity: string;
  location: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  imageUrl: string;
  contactNumber: string;
  archived?: boolean;
}

interface FireAlert {
  id: string;
  type: string;
  image_url: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  timestamp?: any;
}

export default function LogsAndReports() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [fireAlerts, setFireAlerts] = useState<FireAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const prevReportsCount = useRef(0);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  
  useEffect(() => {
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports: Report[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt =
          data.createdAt?.toDate?.() instanceof Date
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();

        return {
          id: doc.id,
          reporterName: data.reporterName || "Unknown Reporter",
          description: data.description || "No description provided",
          severity: data.severity || "unknown",
          location: data.location || "Unknown location",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          imageUrl: data.imageUrl || "",
          createdAt,
          contactNumber: data.contactNumber || "N/A",
          archived: data.archived || false,
        };
      });

      if (prevReportsCount.current && fetchedReports.length > prevReportsCount.current) {
        showNewReportNotification(fetchedReports[0]);
      }

      prevReportsCount.current = fetchedReports.length;
      setReports(fetchedReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio("/alert.mp3");
    audio.play().catch(() => {});
    setTimeout(() => {
      audio.pause();
      audio.src = "";
    }, 5000);
  };


  const showNewReportNotification = (report: Report) => {
    playNotificationSound();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(" New Fire Report Detected!", {
        body: `${report.reporterName}: ${report.description} (Severity: ${report.severity})`,
        icon: "/fire-icon.png",
      });
    }
  };

  
  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("loggedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs: Log[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "unknown",
          confidence: data.confidence || 0,
          image_url: data.image_url || "",
          location: {
            address: data.location?.address || "Mexico, Central Luzon",
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
          },
          loggedAt: data.loggedAt || 0,
          timestamp: data.timestamp || "",
          archived: data.archived || false,
        };
      });
      setLogs(fetchedLogs);
    });
    return () => unsub();
  }, []);

  // 🔥 Fetch Fire Alerts
  useEffect(() => {
    const alertsRef = collection(db, "fire_alerts");
    const q = query(alertsRef, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedAlerts: FireAlert[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "unknown",
          image_url: data.image_url || "",
          location: {
            address: data.location?.address || "Unknown",
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
          },
          timestamp:
            typeof data.timestamp === "string"
              ? data.timestamp
              : new Date().toISOString(),
        };
      });
      setFireAlerts(fetchedAlerts);
    });
    return () => unsub();
  }, []);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "severe_fire":
      case "fire":
        return <AlertTriangle className="text-red-500 w-5 h-5" />;
      case "small_fire":
        return <Flame className="text-orange-500 w-5 h-5" />;
      case "safe":
        return <CheckCircle className="text-green-500 w-5 h-5" />;
      default:
        return <Bell className="text-blue-500 w-5 h-5" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const level = severity.toLowerCase();
    if (level.includes("critical") || level.includes("severe") || level.includes("high")) {
      return "bg-red-100 text-red-700 ring-1 ring-red-200";
    }
    if (level.includes("medium") || level.includes("moderate")) {
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    }
    if (level.includes("low") || level.includes("minor")) {
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }
    return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  };

  const getTypeAccentClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "severe_fire" || t === "fire") {
      return "border-l-red-500";
    }
    if (t === "small_fire") {
      return "border-l-orange-400";
    }
    if (t === "safe") {
      return "border-l-emerald-500";
    }
    return "border-l-blue-500";
  };

  const openDirections = (lat: number, lng: number) => {
    if (!isFinite(lat) || !isFinite(lng)) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const archiveReport = async (report: Report) => {
    const confirmed = confirm("Archive this incident report? It will be hidden from active view but kept in records.");
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, "reports", report.id), {
        archived: true,
        archivedAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to archive report", e);
    }
  };

  const archiveLog = async (log: Log) => {
    const confirmed = confirm("Archive this fire log? It will be hidden from active view but kept in records.");
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, "logs", log.id), {
        archived: true,
        archivedAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to archive log", e);
    }
  };

  const matchesSearch = (text: string | undefined, search: string) => {
    if (!search.trim()) return true;
    if (!text) return false;
    return text.toLowerCase().includes(search.toLowerCase());
  };

  const filterByStatus = (archived: boolean | undefined) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return !archived;
    if (statusFilter === "archived") return !!archived;
    return true;
  };

  const filteredReports = reports.filter((report) => {
    const searchable = [
      report.reporterName,
      report.description,
      report.location,
      report.severity,
      report.contactNumber,
    ].join(" ");

    return matchesSearch(searchable, searchTerm) && filterByStatus(report.archived);
  });

  const filteredLogs = logs.filter((log) => {
    const searchable = [
      log.type,
      log.location?.address,
      String(log.location?.latitude ?? ""),
      String(log.location?.longitude ?? ""),
    ].join(" ");

    return matchesSearch(searchable, searchTerm) && filterByStatus(log.archived);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-8 sm:py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Logs & Reports
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review incident reports and fire logs, archive resolved cases, and quickly search records.
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by reporter, address, severity, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 bg-white/80 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-1.5 py-1 shadow-sm">
              <Filter className="w-4 h-4 text-gray-500 ml-1" />
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("archived")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition mr-1 ${
                  statusFilter === "archived"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
         
          <section className="bg-white/95 rounded-2xl shadow-lg overflow-hidden border border-red-100/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-500/10 to-orange-400/10 px-6 py-4 border-b">
              <Flame className="text-red-500 w-6 h-6" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Fire Reports</h2>
                <p className="text-xs text-gray-500">
                  Citizen-submitted incidents and on-site observations.
                </p>
              </div>
              <span className="text-[11px] font-medium text-gray-500">
                {filteredReports.length} shown
              </span>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading reports...</p>
              ) : filteredReports.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No reports available</p>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                      report.archived ? "opacity-80 ring-1 ring-amber-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {report.reporterName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800">{report.reporterName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getSeverityBadgeClass(
                                report.severity
                              )}`}
                            >
                              Severity: {report.severity}
                            </span>
                            {report.archived && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                                <Archive className="w-3 h-3" /> Archived
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt="Report"
                        className="w-full h-56 object-cover"
                      />
                    ) : (
                      <div className="bg-gray-100 text-gray-400 text-center py-16 text-sm">
                        No image available
                      </div>
                    )}

                    <div className="p-4 text-gray-700 text-sm space-y-2">
                      <p className="leading-snug">
                        <span className="font-medium">Description:</span> {report.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>
                          <span className="font-medium">Location:</span> {report.location}
                        </p>
                        <p>
                          <span className="font-medium">Contact:</span> {report.contactNumber}
                        </p>
                        <p>
                          <span className="font-medium">Coordinates:</span>{" "}
                          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openDirections(report.latitude, report.longitude)}
                          className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                        >
                          <MapPin className="w-4 h-4" /> View on Map
                        </button>
                        {!report.archived && (
                          <button
                            onClick={() => archiveReport(report)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          
          <section className="bg-white/95 rounded-2xl shadow-lg overflow-hidden border border-blue-100/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 px-6 py-4 border-b">
              <Bell className="text-blue-500 w-6 h-6" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Fire Logs & Alerts</h2>
                <p className="text-xs text-gray-500">
                  System-detected events and alert history from cameras.
                </p>
              </div>
              <span className="text-[11px] font-medium text-gray-500">
                {filteredLogs.length + fireAlerts.length} shown
              </span>
            </div>

            <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
              {logs.length === 0 && fireAlerts.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No logs or alerts yet</p>
              ) : (
                <>
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition relative overflow-hidden border-l-4 ${getTypeAccentClass(
                        log.type
                      )} ${log.archived ? "opacity-80 ring-1 ring-amber-100" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getIcon(log.type)}
                        <p className="font-semibold text-gray-800 capitalize">
                          {log.type.replace("_", " ")}
                        </p>
                        {typeof log.confidence === "number" && (
                          <span className="ml-auto inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
                            Confidence: {Math.round((log.confidence || 0) * 100)}%
                          </span>
                        )}
                        {log.archived && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200 ml-auto">
                            <Archive className="w-3 h-3" /> Archived
                          </span>
                        )}
                      </div>

                      {log.image_url && (
                        <img
                          src={log.image_url}
                          alt="Detected Fire"
                          className="w-full h-56 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="text-sm space-y-1 text-gray-500">
                        <p>
                          <span className="font-medium text-gray-600">Address:</span>{" "}
                          {log.location?.address}
                        </p>
                        <p>
                          <span className="font-medium text-gray-600">Latitude:</span>{" "}
                          {log.location?.latitude}
                        </p>
                        <p>
                          <span className="font-medium text-gray-600">Longitude:</span>{" "}
                          {log.location?.longitude}
                        </p>
                        <p className="text-xs text-gray-400 pt-1">
                          <span className="font-medium text-gray-500">Detected at:</span>{" "}
                          {log.loggedAt
                            ? new Date(log.loggedAt).toLocaleString()
                            : "Timestamp unavailable"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() =>
                            openDirections(log.location?.latitude || 0, log.location?.longitude || 0)
                          }
                          className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                        >
                          <MapPin className="w-4 h-4" /> View on Map
                        </button>
                        {!log.archived && (
                          <button
                            onClick={() => archiveLog(log)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {fireAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getIcon(alert.type)}
                        <p className="font-semibold text-gray-800 capitalize">
                          {alert.type.replace("_", " ")}
                        </p>
                      </div>

                      {alert.image_url && (
                        <img
                          src={alert.image_url}
                          alt="Alert Image"
                          className="w-full h-56 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Location:</span> {alert.location.address}</p>
                        <p><span className="font-medium">Latitude:</span> {alert.location.latitude}</p>
                        <p><span className="font-medium">Longitude:</span> {alert.location.longitude}</p>
                        <p className="text-gray-500 text-xs">
                          <span className="font-medium text-gray-600">Timestamp:</span>{" "}
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => openDirections(alert.location.latitude, alert.location.longitude)}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        <MapPin className="w-4 h-4" /> View on Map
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
