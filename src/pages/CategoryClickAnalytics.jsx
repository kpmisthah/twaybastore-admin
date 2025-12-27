import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const CategoryClickAnalytics = () => {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      // .get("https://twayba-backend-oln6.onrender.com/api/category-clicks")
      .get(`${BASE_URL}/category-clicks`)
      .then((res) => {
        const formatted = res.data.map((item) => ({
          category: item.category,
          clicks: item.count,
        }));
        setClicks(formatted);
      })
      .catch((err) => {
        console.error("Error loading category clicks", err);
        setClicks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Category Click Rate Graph</h1>
      {loading ? (
        <div className="text-gray-500">Loading graph...</div>
      ) : clicks.length === 0 ? (
        <div className="text-gray-400">No data available.</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={clicks}
            margin={{ top: 10, right: 30, left: 10, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="clicks" fill="#3182ce" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryClickAnalytics;
