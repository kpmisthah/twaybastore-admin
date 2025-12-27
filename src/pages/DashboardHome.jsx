import React, { useEffect, useState } from "react";
import axios from "axios";

import BASE_URL from "../api/configadmin.js";

const categoryLabels = [
  "Home & Kitchen",
  "Fitness",
  "Gadgets",
  "Shelving",
  "Tools",
  "Camping",
  "Car Accessories",
];

const DashboardHome = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [orderCount, setOrderCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch products and count per category
        const productsRes = await axios.get(`${BASE_URL}/products`);

        const products = productsRes.data || [];
        const counts = {};
        for (const cat of categoryLabels) counts[cat] = 0;
        products.forEach((prod) => {
          if (counts.hasOwnProperty(prod.category)) {
            counts[prod.category]++;
          }
        });
        setCategoryCounts(counts);

        // Fetch orders (just count)
        const ordersRes = await axios.get(`${BASE_URL}/orders`);

        setOrderCount(Array.isArray(ordersRes.data) ? ordersRes.data.length : 0);

        // Fetch users (just count)
        const usersRes = await axios.get(`${BASE_URL}/users`);
        setUserCount(Array.isArray(usersRes.data) ? usersRes.data.length : 0);
      } catch (e) {
        setCategoryCounts({});
        setOrderCount(0);
        setUserCount(0);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col md:flex-row gap-4 mb-10 w-full max-w-4xl px-2">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col items-center py-8">
          <span className="text-lg font-medium text-gray-600 mb-2">Total Orders</span>
          <span className="text-3xl font-extrabold text-blue-700">{orderCount}</span>
        </div>
        <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col items-center py-8">
          <span className="text-lg font-medium text-gray-600 mb-2">Total Users</span>
          <span className="text-3xl font-extrabold text-blue-700">{userCount}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl px-2">
        {categoryLabels.map((cat) => (
          <div
            key={cat}
            className="bg-white border border-gray-200 rounded-lg flex flex-col items-center py-8"
          >
            <span className="text-lg font-medium text-gray-600 mb-2 text-center">{cat}</span>
            <span className="text-3xl font-extrabold text-blue-700">{categoryCounts[cat] ?? 0}</span>
            <span className="text-xs text-gray-400 mt-1">products</span>
          </div>
        ))}
      </div>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-white/80 flex items-center justify-center text-lg text-gray-500 z-10">
          Loading...
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
