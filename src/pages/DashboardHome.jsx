import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
} from "react-icons/fi";

import BASE_URL from "../api/configadmin.js";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    categoryCounts: [],
    recentOrders: [],
    salesData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, usersRes, productsRes] = await Promise.all([
          axios.get(`${BASE_URL}/orders/admin/orders`, { headers }),
          axios.get(`${BASE_URL}/users`, { headers }),
          axios.get(`${BASE_URL}/products?limit=1000`, { headers }),
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const productsData = productsRes.data.products || productsRes.data;
        const products = Array.isArray(productsData) ? productsData : [];

        // Calculate Revenue
        const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgValue = orders.length > 0 ? revenue / orders.length : 0;

        // Process Category Data
        const counts = {};
        products.forEach((p) => {
          const cat = p.category?.trim() || "Uncategorized";
          counts[cat] = (counts[cat] || 0) + 1;
        });
        const categoryData = Object.entries(counts).map(([name, value]) => ({
          name,
          value,
        }));

        // Process Sales Data (Last 30 days)
        const last30Days = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          last30Days[dateStr] = 0;
        }

        orders.forEach((o) => {
          if (!o.createdAt) return;
          try {
            const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
            if (last30Days[dateStr] !== undefined) {
              last30Days[dateStr] += Number(o.total) || 0;
            }
          } catch (err) {
            console.error("Invalid date in order:", o._id);
          }
        });

        const salesTimeline = Object.entries(last30Days).map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          amount: Number(amount.toFixed(2)),
        }));

        setStats({
          totalOrders: orders.length,
          totalUsers: users.length,
          totalRevenue: revenue,
          avgOrderValue: avgValue,
          categoryCounts: categoryData,
          recentOrders: orders.length > 5 ? orders.slice(0, 5) : orders,
          salesData: salesTimeline,
        });
      } catch (e) {
        console.error("Dashboard data fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const kpis = [
    {
      label: "Total Revenue",
      value: `€${stats.totalRevenue.toLocaleString()}`,
      icon: <FiDollarSign className="w-6 h-6" />,
      color: "bg-blue-500",
      trend: "+12.5%",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: <FiShoppingBag className="w-6 h-6" />,
      color: "bg-emerald-500",
      trend: "+5.2%",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: <FiUsers className="w-6 h-6" />,
      color: "bg-orange-500",
      trend: "+8.1%",
    },
    {
      label: "Avg Order Value",
      value: `€${stats.avgOrderValue.toFixed(2)}`,
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: "bg-purple-500",
      trend: "Stable",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium tracking-wide">Synthesizing Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening with your store today.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.color} p-3 rounded-xl text-white shadow-lg shadow-${kpi.color.split('-')[1]}-200`}>
                {kpi.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            </div>
            {/* Subtle background flair */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform ${kpi.color}`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Over Time</h3>
              <p className="text-xs text-gray-500 italic">Daily performance tracking for the last 30 days</p>
            </div>
            <FiActivity className="text-gray-300 w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => `€${val}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`€${val.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">Inventory Mix</h3>
            <FiBox className="text-gray-300 w-5 h-5" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryCounts}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4 overflow-y-auto max-h-[100px] pr-2">
            {stats.categoryCounts.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  {cat.name}
                </div>
                <span className="font-bold text-gray-900">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
          <button
            onClick={() => window.location.href = '/admin/orders'}
            className="text-blue-600 text-xs font-bold hover:underline"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-semibold">Order ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">#{order._id.slice(-6)}</td>
                  <td className="px-6 py-4 text-gray-900">{order.shipping?.name || "Guest"}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    €{(Number(order.total) || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
