import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import BASE_URL from "../api/config";

export default function PreOrders() {
  const [preOrders, setPreOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    productId: "",
    variantId: "",
    variantName: "",
    quantity: 1,
    deposit: 0,
    balance: 0,
    date: new Date().toISOString().slice(0, 10),
    decreaseStock: false
  });

  useEffect(() => {
    fetchPreOrders();
    fetchProducts();
  }, []);

  const fetchPreOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/admin/pre-orders`, {
        withCredentials: true,
      });
      if (data.success) {
        setPreOrders(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pre-orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/products?limit=1000`);
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    }
  };

  const openAddModal = () => {
    setFormData({
      productId: "",
      variantId: "",
      variantName: "",
      quantity: 1,
      deposit: 0,
      balance: 0,
      date: new Date().toISOString().slice(0, 10),
      decreaseStock: true
    });
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (po) => {
    setFormData({
      productId: po.product?._id || "",
      variantId: po.variantId || "",
      variantName: po.variantName || "",
      quantity: po.quantity,
      deposit: po.deposit,
      balance: po.balance,
      date: po.date ? new Date(po.date).toISOString().slice(0, 10) : "",
      decreaseStock: false
    });
    setCurrentId(po._id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pre-order?")) return;
    try {
      await axios.delete(`${BASE_URL}/admin/pre-orders/${id}`, {
        withCredentials: true,
      });
      toast.success("Deleted successfully");
      fetchPreOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`${BASE_URL}/admin/pre-orders/${currentId}`, formData, {
          withCredentials: true,
        });
        toast.success("Updated successfully");
      } else {
        await axios.post(`${BASE_URL}/admin/pre-orders`, formData, {
          withCredentials: true,
        });
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      fetchPreOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save pre-order");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pre-Orders / Bulk Orders</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          + Add Pre-Order
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No pre-orders found.
                  </td>
                </tr>
              ) : (
                preOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {po.product?.images?.[0] && (
                          <img src={po.product.images[0]} alt="" className="h-10 w-10 rounded object-cover mr-3" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {po.product?.name || "Unknown"}
                          {po.variantName && <span className="text-gray-500 ml-1">({po.variantName})</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(po.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {po.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      €{po.deposit?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      €{po.balance?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(po)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button onClick={() => handleDelete(po._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Pre-Order" : "New Pre-Order"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => {
                      const totalStock = p.variants && p.variants.length > 0
                        ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                        : (p.stock || 0);
                      return (
                        <option key={p._id} value={p._id}>{p.name} (Stock: {totalStock})</option>
                      );
                    })}
                  </select>
                </div>
              )}
              
              {!isEdit && formData.productId && (
                (() => {
                  const selectedProd = products.find(p => p._id === formData.productId);
                  if (selectedProd && selectedProd.variants && selectedProd.variants.length > 0) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variant (Color/Size)</label>
                        <select
                          value={formData.variantId}
                          onChange={(e) => {
                            const vId = e.target.value;
                            const variant = selectedProd.variants.find(v => v._id === vId);
                            setFormData({...formData, variantId: vId, variantName: variant ? variant.color : ""});
                          }}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        >
                          <option value="">Any Variant (Random Stock Deduction)</option>
                          {selectedProd.variants.map(v => (
                            <option key={v._id} value={v._id}>{v.color} (Stock: {v.stock || 0})</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="decreaseStock"
                    checked={formData.decreaseStock}
                    onChange={(e) => setFormData({...formData, decreaseStock: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="decreaseStock" className="ml-2 block text-sm text-gray-900">
                    Decrease from global stock automatically
                  </label>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                >
                  Save Pre-Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
