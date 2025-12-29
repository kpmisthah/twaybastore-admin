import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaImage } from "react-icons/fa";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";

export default function BannerManagement() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        desktopImage: "",
        mobileImage: "",
        link: "/products",
        order: 0,
        isActive: true,
    });
    const [uploading, setUploading] = useState({ desktop: false, mobile: false });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const token = localStorage.getItem("adminToken");

            if (!token) {
                console.error("No admin token found");
                alert("Please login first to access banner management");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${BASE_URL}/banners/admin/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBanners(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching banners:", error);
            if (error.response?.status === 401) {
                alert("Session expired. Please login again.");
            } else {
                alert("Failed to fetch banners: " + (error.response?.data?.message || error.message));
            }
            setLoading(false);
        }
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;

        setUploading((prev) => ({ ...prev, [type]: true }));

        const formDataUpload = new FormData();
        formDataUpload.append("image", file);

        try {
            const token = localStorage.getItem("adminToken");
            const response = await axios.post(`${BASE_URL}/upload`, formDataUpload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            const imageUrl = response.data.url;
            setFormData((prev) => ({
                ...prev,
                [type === "desktop" ? "desktopImage" : "mobileImage"]: imageUrl,
            }));

            alert(`${type === "desktop" ? "Desktop" : "Mobile"} image uploaded successfully!`);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image");
        } finally {
            setUploading((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.desktopImage || !formData.mobileImage) {
            alert("Please fill in all required fields and upload both images");
            return;
        }

        try {
            const token = localStorage.getItem("adminToken");

            if (editingBanner) {
                // Update existing banner
                await axios.put(`${BASE_URL}/banners/${editingBanner._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("Banner updated successfully!");
            } else {
                // Create new banner
                await axios.post(`${BASE_URL}/banners`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("Banner created successfully!");
            }

            resetForm();
            fetchBanners();
        } catch (error) {
            console.error("Error saving banner:", error);
            alert("Failed to save banner");
        }
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            desktopImage: banner.desktopImage,
            mobileImage: banner.mobileImage,
            link: banner.link,
            order: banner.order,
            isActive: banner.isActive,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;

        try {
            const token = localStorage.getItem("adminToken");
            await axios.delete(`${BASE_URL}/banners/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Banner deleted successfully!");
            fetchBanners();
        } catch (error) {
            console.error("Error deleting banner:", error);
            alert("Failed to delete banner");
        }
    };

    const handleToggle = async (id) => {
        try {
            const token = localStorage.getItem("adminToken");
            await axios.patch(`${BASE_URL}/banners/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchBanners();
        } catch (error) {
            console.error("Error toggling banner:", error);
            alert("Failed to toggle banner status");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            desktopImage: "",
            mobileImage: "",
            link: "/products",
            order: 0,
            isActive: true,
        });
        setEditingBanner(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading banners...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Hero Banner Management</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <FaPlus /> Add New Banner
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4">
                        {editingBanner ? "Edit Banner" : "Add New Banner"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="e.g., Christmas Sale 2025"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Desktop Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Desktop Image *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], "desktop")}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    disabled={uploading.desktop}
                                />
                                {uploading.desktop && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                                {formData.desktopImage && (
                                    <img
                                        src={formData.desktopImage}
                                        alt="Desktop preview"
                                        className="mt-2 w-full h-32 object-cover rounded border"
                                    />
                                )}
                            </div>

                            {/* Mobile Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Mobile Image *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], "mobile")}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    disabled={uploading.mobile}
                                />
                                {uploading.mobile && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                                {formData.mobileImage && (
                                    <img
                                        src={formData.mobileImage}
                                        alt="Mobile preview"
                                        className="mt-2 w-full h-32 object-cover rounded border"
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Link URL</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="/products?category=Sale"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Order</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    value={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                disabled={uploading.desktop || uploading.mobile}
                            >
                                {editingBanner ? "Update Banner" : "Create Banner"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banners List */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">All Banners ({banners.length})</h2>
                </div>

                {banners.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FaImage className="mx-auto text-6xl mb-4 opacity-30" />
                        <p>No banners yet. Click "Add New Banner" to create one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {banners.map((banner) => (
                            <div key={banner._id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start gap-4">
                                    {/* Preview Images */}
                                    <div className="flex gap-2">
                                        <img
                                            src={banner.desktopImage}
                                            alt={banner.title}
                                            className="w-32 h-20 object-cover rounded border"
                                            title="Desktop version"
                                        />
                                        <img
                                            src={banner.mobileImage}
                                            alt={banner.title}
                                            className="w-20 h-20 object-cover rounded border"
                                            title="Mobile version"
                                        />
                                    </div>

                                    {/* Banner Info */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{banner.title}</h3>
                                        <p className="text-sm text-gray-600">Link: {banner.link}</p>
                                        <p className="text-sm text-gray-600">Order: {banner.order}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${banner.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {banner.isActive ? "Active" : "Inactive"}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Created: {new Date(banner.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleToggle(banner._id)}
                                            className={`px-3 py-1 rounded flex items-center gap-1 text-sm ${banner.isActive
                                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                : "bg-green-100 text-green-800 hover:bg-green-200"
                                                }`}
                                            title={banner.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {banner.isActive ? <FaToggleOff /> : <FaToggleOn />}
                                            {banner.isActive ? "Disable" : "Enable"}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded flex items-center gap-1 text-sm hover:bg-blue-200"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="bg-red-100 text-red-800 px-3 py-1 rounded flex items-center gap-1 text-sm hover:bg-red-200"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
