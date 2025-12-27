import { useEffect, useState } from "react";

// Friendly names
const pageNames = {
  "/": "Homepage",
  "/contact": "Contact Page",
  "/about-twayba-group": "About Us",
  "/privacy": "Privacy Policy",
  "/cancellation": "Cancellation Policy",
  "/terms-of-use": "Terms of Use",
  "/careersattwaybagroup": "Careers",
  "/products": "Products Listing",
  "/wishlist": "Wishlist",
  "/carts": "Shopping Cart",
  "/orders": "Orders",
  "/profile": "Profile Page",
  "/help": "Help Center",
  "/login": "Login",
  "/signup": "Signup",
};

export default function PageAnalytics() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://twayba-backend-oln6.onrender.com/api/analytics/pages");
      const data = await res.json();
      setPages(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const formatPageName = (path) => {
    if (pageNames[path?.toLowerCase()]) return pageNames[path.toLowerCase()];
    if (path?.startsWith("/product/")) return "Product Detail Page";
    return path || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          📊 Staff-Friendly Page Analytics
        </h2>

        {/* Chrome-style window */}
        <div className="rounded-xl shadow-xl border bg-white overflow-hidden">
          {/* Top bar (fake Chrome controls) */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="ml-4 text-xs text-gray-600 font-medium">
              www.twayba.com
            </span>
          </div>

          {/* Content */}
          <div className="p-6 bg-gray-50">
            {loading ? (
              <p className="text-gray-500">Loading analytics…</p>
            ) : pages.length > 0 ? (
              <div className="space-y-4">
                {pages
                  .sort((a, b) => b.count - a.count) // highest first
                  .slice(0, 10) // top 10
                  .map((p, i) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between bg-white border rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            i < 3
                              ? "bg-indigo-100 text-indigo-700 font-semibold"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatPageName(p._id)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {p.count} visits
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No analytics data available. Start browsing to generate data!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
