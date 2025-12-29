import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/products/add", label: "Add Product" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/supportchat", label: "Support Chat" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/product/Analytics", label: "Products Analytics" }, // kept your path
  { to: "/UsersList", label: "Users List" },
  { to: "/ProductClicksAnalytics", label: "Product Clicks" },
  { to: "/CategoryClickAnalytics", label: "Category Clicks" },
  { to: "/AdminPayments", label: "Admin Payments" },
  { to: "/VoiceSearches", label: "Users Searches" },
  { to: "/page-visit", label: "Page visit" },
  { to: "/adminmails", label: "Mails" },
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 sm:hidden transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed z-50 sm:static sm:translate-x-0 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"}
        flex flex-col`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="font-extrabold text-base tracking-tight text-gray-900">
            Admin Panel
          </div>
          <button
            onClick={onClose}
            className="sm:hidden inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
            aria-label="Close sidebar"
            type="button"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {links.map(({ to, label, exact }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={Boolean(exact)}
                  className={({ isActive }) =>
                    [
                      "block rounded-md px-3 py-2 text-sm",
                      "hover:bg-gray-100 hover:text-gray-900",
                      isActive
                        ? "bg-gray-100 text-gray-900 font-semibold"
                        : "text-gray-700",
                    ].join(" ")
                  }
                  onClick={onClose}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
          © {new Date().getFullYear()} Twayba Admin
        </div>
      </aside>
    </>
  );
}
