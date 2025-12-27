import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../auth/AuthProvider";

const AdminNavbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="inline-flex sm:hidden items-center justify-center rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50"
            aria-label="Toggle sidebar"
            type="button"
          >
            ☰
          </button>
          <span className="hidden sm:inline-block text-sm text-gray-600">
            Admin Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col leading-tight text-right">
            <span className="text-sm font-medium text-gray-900">
              {user?.username || user?.email || "Admin"}
            </span>
            <span className="text-[11px] text-gray-500">Signed in</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex items-center rounded-md bg-gray-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-black"
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
