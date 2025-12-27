import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

const STATUS_OPTIONS = ["Processing", "Packed", "Delivered", "Cancelled"];
const STATUS_COLORS = {
  Processing: "bg-yellow-100 text-yellow-800 border-yellow-400",
  Packed: "bg-orange-100 text-orange-800 border-orange-400",
  Delivered: "bg-green-100 text-green-800 border-green-400",
  Cancelled: "bg-red-100 text-red-700 border-red-400",
};

const PRIORITY = {
  Processing: 1,
  Packed: 2,
  Delivered: 3,
  Cancelled: 4,
};

const canChangeStatus = (createdAt, status) => {
  if (status === "Cancelled") return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created >= 2 * 60 * 60 * 1000;
};

const sortOrders = (arr) =>
  [...arr].sort((a, b) => {
    const pa = PRIORITY[a.status] || 99;
    const pb = PRIORITY[b.status] || 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pending, setPending] = useState(null);
  const [inputOrderId, setInputOrderId] = useState({});
  const [error, setError] = useState({});
  const [copied, setCopied] = useState({});

  useEffect(() => {
    axios.get(`${BASE_URL}/orders/admin/orders`).then((res) => {
      setOrders(sortOrders(res.data));
    });
  }, []);

  const handleCopy = (orderId) => {
    const last6 = orderId.slice(-6);
    navigator.clipboard.writeText(last6);
    setCopied((c) => ({ ...c, [orderId]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [orderId]: false })), 1200);
  };

  const handleStatusChange = async (order, newStatus) => {
    if (
      !inputOrderId[order._id] ||
      inputOrderId[order._id] !== order._id.slice(-6)
    ) {
      setError((e) => ({
        ...e,
        [order._id]: "Enter last 6 digits of Order ID to confirm!",
      }));
      return;
    }
    setError((e) => ({ ...e, [order._id]: "" }));
    setPending(order._id);

    try {
      await axios.put(`${BASE_URL}/orders/${order._id}/status`, {
        status: newStatus,
      });

      setOrders((old) =>
        sortOrders(
          old.map((o) =>
            o._id === order._id ? { ...o, status: newStatus } : o
          )
        )
      );
      setInputOrderId((inp) => ({ ...inp, [order._id]: "" }));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-6">All Orders (Admin)</h2>
      <div className="space-y-6">
        {orders.map((order) => {
          const statusWindow = canChangeStatus(order.createdAt, order.status);
          return (
            <div key={order._id} className="bg-white rounded shadow p-4 border">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="font-medium">
                    Order #{order._id.slice(-6)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {order.user?.fullName} ({order.user?.mobile})
                  </span>
                </div>

                <div
                  className={`inline-block rounded px-2 py-1 ${STATUS_COLORS[order.status]
                    } border`}
                  title={
                    !statusWindow
                      ? "Order status can only be changed after 2 hours of placement."
                      : order.status === "Cancelled"
                        ? "Status cannot be changed for cancelled orders"
                        : ""
                  }
                >
                  <select
                    className="bg-transparent outline-none"
                    value={order.status}
                    disabled={!statusWindow || pending === order._id}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Confirm + Copy */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Enter last 6 digits: ${order._id.slice(-6)}`}
                  value={inputOrderId[order._id] || ""}
                  onChange={(e) =>
                    setInputOrderId((inp) => ({
                      ...inp,
                      [order._id]: e.target.value,
                    }))
                  }
                  className="border px-2 py-1 rounded text-xs w-40 mr-2"
                  disabled={!statusWindow}
                />

                <button
                  type="button"
                  className={`px-2 py-1 rounded text-xs border bg-gray-100 ${copied[order._id]
                    ? "bg-green-200 text-green-700 border-green-400"
                    : "hover:bg-gray-200"
                    }`}
                  onClick={() => handleCopy(order._id)}
                  disabled={!statusWindow}
                >
                  {copied[order._id]
                    ? "Copied!"
                    : `Copy: ${order._id.slice(-6)}`}
                </button>

                {error[order._id] && (
                  <span className="text-red-600 text-xs ml-2">
                    {error[order._id]}
                  </span>
                )}
              </div>

              {!statusWindow && (
                <div className="text-xs text-red-500 mt-1">
                  Status changes are locked until 2 hours after order placement.
                </div>
              )}

              <div className="text-gray-500 text-xs mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </div>

              {/* User Details */}
              {order.user && (
                <div className="bg-blue-50 border border-blue-100 rounded p-2 my-2 text-xs">
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {order.user.email || (
                      <span className="text-gray-400">Not Provided</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">Phone:</span>{" "}
                    {order.user.mobile}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Address:</span>{" "}
                    {[order.user.street, order.user.area, order.user.city, order.user.zipCode]
                      .filter(Boolean)
                      .join(", ") || (
                        <span className="text-gray-400">Not Provided</span>
                      )}
                  </div>
                </div>
              )}

              {/* Items */}
              <ul className="mt-2 text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx} className="mb-1">
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      {item.dimensions && (
                        <span className="ml-2 text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Dimensions: {item.dimensions}
                        </span>
                      )}
                      {item.color && (
                        <span className="ml-2 text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          Color: {item.color}
                        </span>
                      )}
                      <span className="ml-2">
                        x {item.qty} — €{(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Payment */}
              <div className="mt-2 text-xs">
                {order.paymentMethod === "COD" ? (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded">
                    Cash on Delivery (Ref: {order.codReference || "N/A"})
                  </span>
                ) : order.isPaid && order.paymentIntentId ? (
                  <>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded mr-2">
                      Payment completed
                    </span>
                    <span className="font-semibold">Payment ID:</span>{" "}
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.paymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline break-all"
                    >
                      {order.paymentIntentId}
                    </a>
                  </>
                ) : (
                  <span className="text-gray-400">Payment not completed</span>
                )}
              </div>

              <div className="mt-2 font-semibold">
                Total: €{order.total.toFixed(2)}
              </div>

              {order.status === "Cancelled" && order.cancelReason && (
                <div className="mt-2 text-sm text-red-700 bg-red-50 rounded px-3 py-2 border border-red-200">
                  <span className="font-semibold">Cancelled Reason:</span>
                  <br />
                  {order.cancelReason}
                </div>
              )}
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center text-gray-500 mt-12">No orders yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
