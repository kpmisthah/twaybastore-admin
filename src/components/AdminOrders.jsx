import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";
import { FiMapPin, FiCheckCircle, FiX } from "react-icons/fi";

const LOCATIONS = ["downstairs", "upstairs", "store", "mosta_garage", "naxxar_garage"];

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
  const [fulfillModal, setFulfillModal] = useState({ open: false, order: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${BASE_URL}/orders/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
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
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/orders/${order._id}/status`, {
        status: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` },
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
                  {order.user ? (
                    <span className="ml-2 text-xs text-gray-500">
                      {order.user.fullName} ({order.user.mobile})
                    </span>
                  ) : (
                    <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 uppercase tracking-tight">
                      Guest Order
                    </span>
                  )}
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
                    disabled={!statusWindow || pending === order._id || (!order.isFulfilled && order.status === "Processing")}
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

              {!order.isFulfilled && order.status === "Processing" && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm font-bold flex items-center gap-1.5"><FiMapPin /> Locations must be allocated before shipping</span>
                  <button onClick={() => setFulfillModal({ open: true, order })} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm hover:bg-red-700 transition">
                    Allocate Stock
                  </button>
                </div>
              )}

              {order.isFulfilled && (
                <div className="mt-2 text-xs text-green-700 font-bold flex items-center gap-1">
                  <FiCheckCircle /> Stock Allocated
                </div>
              )}

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

              {/* User / Guest Details */}
              {(order.user || order.shipping) && (
                <div className={`${order.user ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded p-2 my-2 text-xs`}>
                  {order.user ? (
                    <>
                      <div>
                        <span className="font-semibold">Email:</span> {order.user.email || <span className="text-gray-400">Not Provided</span>}
                      </div>
                      <div>
                        <span className="font-semibold">Phone:</span> {order.user.mobile}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Address:</span> {[order.user.street, order.user.area, order.user.city, order.user.zipCode].filter(Boolean).join(", ") || <span className="text-gray-400">Not Provided</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-semibold">Customer:</span> {order.shipping?.name} (Guest)
                      </div>
                      <div>
                        <span className="font-semibold">Email:</span> {order.shipping?.email}
                      </div>
                      <div>
                        <span className="font-semibold">Phone:</span> {order.shipping?.phone}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Address:</span> {[order.shipping?.address, order.shipping?.city, order.shipping?.state, order.shipping?.zip, order.shipping?.country].filter(Boolean).join(", ")}
                      </div>
                    </>
                  )}
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
                      {order.isFulfilled && item.fulfilledLocations && item.fulfilledLocations.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 p-1.5 rounded inline-block">
                          Taken from: {item.fulfilledLocations.map(l => `${l.location} (${l.quantity})`).join(", ")}
                        </div>
                      )}
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
                ) : order.paymentMethod === "PICKUP" ? (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded">
                    Pickup from Shop
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

      {fulfillModal.open && (
        <FulfillOrderModal
          order={fulfillModal.order}
          onClose={() => setFulfillModal({ open: false, order: null })}
          onSuccess={(updatedOrder) => {
            setOrders(old => old.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            setFulfillModal({ open: false, order: null });
          }}
        />
      )}
    </div>
  );
};

/* ═══════ FULFILL ORDER MODAL ═══════ */
function FulfillOrderModal({ order, onClose, onSuccess }) {
  const [data, setData] = useState(
    order.items.map(item => ({
      itemId: item._id,
      name: item.name,
      required: item.qty,
      locations: { downstairs: 0, upstairs: 0, store: 0, mosta_garage: 0 , naxxar_garage: 0  }
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLocChange = (index, loc, val) => {
    const newData = [...data];
    newData[index].locations[loc] = Math.max(0, parseInt(val) || 0);
    setData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate sums
    for (const item of data) {
      const sum = LOCATIONS.reduce((acc, l) => acc + item.locations[l], 0);
      if (sum !== item.required) {
        return setError(`You must allocate exactly ${item.required} items for "${item.name}". Currently allocated: ${sum}`);
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = data.map(d => ({
        itemId: d.itemId,
        locations: d.locations
      }));

      const res = await axios.post(`${BASE_URL}/orders/${order._id}/fulfill`, {
        fulfillmentData: payload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fulfill order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FiMapPin className="text-red-600" /> Allocate Inventory Locations
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4 font-medium">
            Where are you taking these items from? Specify the quantities for each location. You cannot process this order until allocations match the order quantity.
          </p>

          <form id="fulfill-form" onSubmit={handleSubmit} className="space-y-6">
            {data.map((item, index) => {
              const currentSum = LOCATIONS.reduce((acc, l) => acc + item.locations[l], 0);
              const isMatch = currentSum === item.required;

              return (
                <div key={item.itemId} className={`p-4 rounded-lg border ${isMatch ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-gray-800">{item.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Allocated: {currentSum} / {item.required}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {LOCATIONS.map(loc => (
                      <div key={loc}>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{loc}</label>
                        <input
                          type="number" min="0"
                          value={item.locations[loc] || ""}
                          onChange={e => handleLocChange(index, loc, e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md text-sm font-mono focus:outline-none focus:ring-1 ${isMatch ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </form>

          {error && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded text-sm font-bold border border-red-200">{error}</div>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" form="fulfill-form" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">
            {loading ? "Processing..." : "Confirm Allocations"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
