import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin";
import { FiClock, FiAlertCircle, FiShoppingBag, FiUser, FiPhone, FiMail } from "react-icons/fi";

export default function AbandonedCheckouts() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/admin/abandoned-checkouts?page=${page}&limit=20`);
      setOrders(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <FiAlertCircle className="text-rose-500 w-8 h-8" />
            Abandoned Checkouts
          </h1>
          <p className="text-gray-500 text-sm">
            Users who clicked "Place Order" via Card payment but failed to complete the transaction. ({totalRecords} found)
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin border-4 border-indigo-200 border-t-indigo-600 rounded-full w-10 h-10"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-gray-500 flex flex-col items-center">
              <FiShoppingBag className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">No abandoned checkouts found.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4 min-w-[250px]">Items Attempted</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 min-w-[150px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => {
                      const contact = order.contact || order.shipping || {};
                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-gray-900 flex items-center gap-2"><FiUser className="text-gray-400 w-4 h-4" /> {contact.name || "Unknown"}</span>
                              {contact.email && <span className="text-gray-500 flex items-center gap-2 text-xs"><FiMail className="text-gray-400 w-3.5 h-3.5" /> {contact.email}</span>}
                              {contact.phone && <span className="text-gray-500 flex items-center gap-2 text-xs"><FiPhone className="text-gray-400 w-3.5 h-3.5" /> {contact.phone}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 max-w-[300px]">
                                  {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-xs text-gray-800 line-clamp-2 leading-snug">{item.name}</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5">Qty: {item.qty} {item.color ? `| ${item.color}` : ''}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900 text-base">€{order.total?.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              order.paymentStatus === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                            <div className="flex items-center gap-2 text-sm">
                              <FiClock className="text-gray-400" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 ml-6">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {orders.map((order) => {
                  const contact = order.contact || order.shipping || {};
                  return (
                    <div key={order._id} className="p-4 space-y-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-gray-900 text-xl">€{order.total?.toFixed(2)}</span>
                          <span className={`w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            order.paymentStatus === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentStatus || 'pending'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><FiClock className="text-gray-400 w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-2">
                          <span className="font-bold text-gray-900 flex items-center gap-2.5 text-sm"><FiUser className="text-gray-400 w-4 h-4" /> {contact.name || "Unknown"}</span>
                          {contact.email && <span className="text-gray-600 flex items-center gap-2.5 text-xs"><FiMail className="text-gray-400 w-4 h-4" /> {contact.email}</span>}
                          {contact.phone && <span className="text-gray-600 flex items-center gap-2.5 text-xs"><FiPhone className="text-gray-400 w-4 h-4" /> {contact.phone}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Items Attempted</span>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                            {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-50 border border-gray-100" />}
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-gray-800 line-clamp-2 leading-snug">{item.name}</span>
                              <span className="text-[11px] text-gray-500 mt-1 font-medium">Qty: {item.qty} {item.color ? `| ${item.color}` : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 bg-white shadow-sm rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Previous</button>
              <span className="text-sm font-medium text-gray-500">Page <b className="text-gray-800">{page}</b> of <b className="text-gray-800">{totalPages}</b></span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 bg-white shadow-sm rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
