"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Video from "./Video";

import Users from "./Users";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  getIdTokenResult,
  signOut,
} from "firebase/auth";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  Video as VideoIcon,
  ClipboardList,
  Users as UsersIcon,
  BarChart3,
  AlertTriangle,
  FileText,
} from "lucide-react";
import LogsAndReports from "./LogsAndReports";

function DashboardStats() {
  const [stats, setStats] = useState({ users: 0, alerts: 0, logs: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersSnap, alertsSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "alerts")),
          getDocs(collection(db, "logs")),
        ]);
        setStats({
          users: usersSnap.size,
          alerts: alertsSnap.size,
          logs: logsSnap.size,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      }
    };
    fetchData();
  }, []);

  const cards = [
    {
      label: "Users",
      value: stats.users,
      icon: <UsersIcon className="text-red-600 w-6 h-6" />,
      bg: "bg-red-100",
    },
    {
      label: "Total Alerts",
      value: stats.alerts,
      icon: <AlertTriangle className="text-yellow-600 w-6 h-6" />,
      bg: "bg-yellow-100",
    },
    {
      label: "Logs & Reports",
      value: stats.logs,
      icon: <FileText className="text-green-600 w-6 h-6" />,
      bg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-white/90 backdrop-blur-xl border border-gray-200 p-6 rounded-2xl shadow-md hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">{c.label}</h3>
            <div className={`p-3 ${c.bg} rounded-full`}>{c.icon}</div>
          </div>
          <p className="text-4xl font-bold mt-4 text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

interface AlertSummary {
  type?: string;
  confidence?: number;
  timestamp?: number;
}

interface LogSummary {
  type?: string;
  timestamp?: number;
}

function RecentAlertsLogs() {
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [logs, setLogs] = useState<LogSummary[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const alertsSnap = await getDocs(
        query(collection(db, "alerts"), orderBy("timestamp", "desc"), limit(5))
      );
      const logsSnap = await getDocs(
        query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(5))
      );

      setAlerts(alertsSnap.docs.map((d) => d.data()));
      setLogs(logsSnap.docs.map((d) => d.data()));
    };

    fetchRecent();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Resolved Alerts
        </h3>
        <ul className="space-y-3 text-sm">
          {alerts.map((a, i) => (
            <li
              key={i}
              className="p-3 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition"
            >
              <span className="font-semibold text-red-700">{a.type}</span> –{" "}
              <span>{Math.round(a.confidence * 100)}%</span>
              <div className="text-gray-500 text-xs mt-1">
                {a.timestamp ? new Date(a.timestamp * 1000).toLocaleString() : "No timestamp"}
              </div>
            </li>
          ))}
        </ul>
      </div>

      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Recent Logs & Reports
        </h3>
        <ul className="space-y-3 text-sm">
          {logs.map((l, i) => (
            <li
              key={i}
              className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition"
            >
              <span className="font-semibold text-gray-800">{l.type}</span>
              <div className="text-gray-500 text-xs mt-1">
                {l.timestamp ? new Date(l.timestamp * 1000).toLocaleString() : "No timestamp"}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface ChartPoint {
  date: string;
  alerts: number;
}

function AlertsChart() {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const alertsSnap = await getDocs(
        query(collection(db, "alerts"), orderBy("timestamp", "desc"), limit(50))
      );

      const grouped: Record<string, number> = {};

      alertsSnap.docs.forEach((doc) => {
        const a = doc.data();
        const date = new Date(a.timestamp * 1000).toLocaleDateString("en-US", {
          weekday: "short",
        });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      const formatted = Object.entries(grouped).map(([date, alerts]) => ({
        date,
        alerts,
      }));

      setData(formatted.reverse());
    };

    fetchAlerts();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Alerts Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="alerts"
            stroke="#dc2626"
            strokeWidth={3}
            dot={{ r: 5, fill: "#dc2626" }}
          />
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);

  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin-login");
        return;
      }
      const tokenResult = await getIdTokenResult(user, true);
      if (!tokenResult.claims.admin) {
        await signOut(auth);
        router.push("/admin-login");
        return;
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 animate-pulse">Checking access...</p>
      </div>
    );
  }

  const sections: Record<string, JSX.Element> = {
    dashboard: (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h1>
        <DashboardStats />
        <RecentAlertsLogs />
        <AlertsChart />
      </div>
    ),
    video: <Video />,
    logsReports: <LogsAndReports />,
    users: <Users />,
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      key: "video",
      label: "Video Feed",
      icon: <VideoIcon className="w-5 h-5" />,
    },
    {
      key: "logsReports",
      label: "Logs & Reports",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      key: "users",
      label: "Users",
      icon: <UsersIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex h-screen font-sans bg-gray-100">
      
      <motion.aside
        initial={{ x: -220 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-64 bg-gradient-to-b from-red-700 to-red-900 text-white shadow-2xl flex flex-col"
      >
        <div className="px-6 py-6 border-b border-red-600 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold tracking-wide"> FlareGuard</h2>
        </div>

        <ul className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => setActiveSection(item.key)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.key
                    ? "bg-white text-red-700 font-semibold shadow-md"
                    : "hover:bg-red-600 hover:shadow-sm"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-6 py-4 border-t border-red-600">
          <button
            type="button"
            onClick={async () => {
              await signOut(auth);
              router.push("/");
            }}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-800 hover:bg-red-700 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
        <div className="px-6 py-4 text-xs text-red-200 border-t border-red-800">
          © 2025 FlareGuard
        </div>
      </motion.aside>

      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 transition-all">
          {sections[activeSection]}
        </div>
      </main>
    </div>
  );
}
