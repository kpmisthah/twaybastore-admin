import React, { useEffect, useState } from "react";
import axios from "axios";

import BASE_URL from "../api/configadmin.js";

const FILTERS = ["All", "Processing", "Packed", "Delivered", "Cancelled"];

const AdminPayments = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [filterTotal, setFilterTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/orders`)
      .then((res) => {
        const data = res.data || [];

        // Valid paid orders (excluding cancelled)
        const validOrders = data.filter(
          (o) =>
            o.status === "Processing" ||
            o.status === "Packed" ||
            o.status === "Delivered"
        );

        // Correct total EURO sales (exclude cancelled)
        const total = validOrders.reduce(
          (acc, o) => acc + (o.total || 0),
          0
        );

        setOrders(data);
        setTotalSales(total);
        setFiltered(validOrders);
        setFilterTotal(total); // Default = valid orders only
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
        setOrders([]);
        setTotalSales(0);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtering system
  const applyFilter = (status) => {
    setActiveFilter(status);

    let filteredList = [];

    if (status === "All") {
      filteredList = orders.filter(
        (o) =>
          o.status === "Processing" ||
          o.status === "Packed" ||
          o.status === "Delivered"
      );
    } else {
      filteredList = orders.filter((o) => o.status === status);
    }

    setFiltered(filteredList);

    // Calculate total for filtered results
    const total = filteredList.reduce((acc, o) => acc + (o.total || 0), 0);
    setFilterTotal(total);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Payment Dashboard</h1>

      {/* Total Sales Card */}
      <div className="mb-10">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between max-w-xl">
          <div>
            <div className="text-gray-500 text-sm">
              {activeFilter === "All"
                ? "Total EURO Sales (Completed Orders)"
                : `Total for ${activeFilter} Orders`}
            </div>

            <div className="text-3xl font-bold text-blue-700">
              €{filterTotal.toFixed(2)}
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {activeFilter === "All"
              ? "Only completed orders"
              : `Showing ${activeFilter} orders`}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => applyFilter(f)}
            className={`px-4 py-2 rounded-md border text-sm font-medium ${activeFilter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500">No matching orders.</div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-100 text-sm text-left">
                <th className="py-2 px-4">Order ID</th>
                <th className="py-2 px-4">User</th>
                <th className="py-2 px-4">Amount (€)</th>
                <th className="py-2 px-4">Payment Method</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Date</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order._id}
                  className="border-b hover:bg-gray-50 text-sm"
                >
                  <td className="py-2 px-4">{order._id.slice(-6)}</td>
                  <td className="py-2 px-4">
                    {order.user?.fullName || "Guest"}
                  </td>
                  <td className="py-2 px-4 font-semibold text-blue-800">
                    €{order.total.toFixed(2)}
                  </td>
                  <td className="py-2 px-4">{order.paymentMethod || "N/A"}</td>

                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Packed"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                        }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="py-2 px-4">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
