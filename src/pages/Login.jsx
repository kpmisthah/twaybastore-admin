import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import BASE_URL from "../api/configadmin.js";
/** Local background images (served from /public) */
const BG_IMAGES = [""];

/** Motivational quotes */
const QUOTES = [
  {
    text: "Discipline beats motivation. Show up anyway.",
    author: "— Team Twayba",
  },
  {
    text: "Build every day. Small wins compound into empires.",
    author: "— Team Twayba",
  },
  {
    text: "Trust is our currency. Results are our signature.",
    author: "— Team Twayba",
  },
  {
    text: "Rich is a by-product of relentless execution.",
    author: "— Team Twayba",
  },
  { text: "Move fast. Be precise. Stay humble. Win.", author: "— Team Twayba" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Login() {
  const { isAuthed, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // where to go after login
  const fromLoc = location.state?.from;
  const next = (fromLoc?.pathname || "") + (fromLoc?.search || "") || "/admin";

  // random background + quote (stable for this render)
  const bgImage = useMemo(() => pick(BG_IMAGES), []);
  const quote = useMemo(() => pick(QUOTES), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (isAuthed) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Login failed.");

      const token = data?.token;
      const admin = data?.admin || { email: email.trim() };
      if (!token) throw new Error("No token returned by server.");

      login(token, admin);
      navigate(next, { replace: true });
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Side — Vector Image */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <img src="/login.jpg" draggable='false' alt="Login Illustration" className="w-4/5" />

            <h1 className="text-3xl font-semibold text-gray-900 mt-6">
              Welcome to Twayba Admin
            </h1>

            <p className="text-gray-500 text-sm mt-2 text-center max-w-md leading-relaxed">
              Manage operations, monitor analytics, and control your platform
              with clarity and precision.
            </p>
          </div>

          {/* Right Side — Login Form */}
          <div>
            <div className="bg-white rounded-3xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <img
                  src="https://www.twayba.com/emailLogo.png"
                  alt="Twayba Logo"
                  draggable='false'
                  className="mx-auto h-10"
                />
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  Admin Login
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sign in to continue
                </p>
              </div>

              {err && (
                <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-200">
                  {err}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium text-base
                hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Twayba — Secure Admin Panel
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
