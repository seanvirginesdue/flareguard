"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Login failed. Please try again.";
  }
}

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken(true);

      const res = await fetch("/api/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "Not authorized" ? "This account does not have admin access." : "Login failed.");
        return;
      }

      router.push("/admin-dashboard");
    } catch (err: unknown) {
      const code = (err as AuthError)?.code ?? "";
      setError(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      {/* Branding side */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-orange-400 opacity-90" />
        <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative z-10 text-left max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/20 text-xs font-medium text-white/90">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FlareGuard Command Center</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg leading-tight">
            BFP Admin Portal
          </h1>
          <p className="text-base lg:text-lg text-white/90">
            Secure access to your fire safety monitoring dashboard. Stay ahead of
            incidents with real-time alerts and analytics.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-4 rounded-full bg-emerald-300" />
              Real-time camera feeds and smoke detection
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-4 rounded-full bg-yellow-300" />
              Centralized alert management and logs
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-4 rounded-full bg-sky-300" />
              Role-based access for authorized personnel
            </li>
          </ul>
        </div>
      </div>

      {/* Login card */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 md:py-12">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-200">
          <div className="mb-6 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500 mb-1">
              Admin Access
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your authorized BFP admin credentials.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm md:text-[15px] bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm md:text-[15px] bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-transform shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-xs md:text-sm text-center text-gray-500">
            Having issues?{" "}
            <a href="#" className="text-red-600 hover:underline font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
