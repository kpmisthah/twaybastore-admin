import React, { useEffect, useState } from "react";
import axios from "axios";

const STATUS_COLOR = {
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-700",
};

const AdminRefundLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/admin/refund-logs")
      .then(res => {
        // Defensive check
        if (Array.isArray(res.data)) setLogs(res.data);
        else setLogs([]);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Refund Logs</h2>
      <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 px-3">Order</th>
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Stripe Refund</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-zinc-500">
                  No refund logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  <td className="py-2 px-3">{log.orderId?._id?.slice(-6)}</td>
                  <td className="py-2 px-3">
                    {log.userId?.fullName || "-"}
                    <br />
                    <span className="text-xs text-zinc-400">{log.userId?.email}</span>
                  </td>
                  <td className="py-2 px-3">€{log.amount?.toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[log.status] || ""}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 break-all">{log.refundId || "-"}</td>
                  <td className="py-2 px-3">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-xs max-w-xs truncate" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRefundLogs;
