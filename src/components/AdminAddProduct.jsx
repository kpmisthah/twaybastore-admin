import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../api/config";

const uploadToCloudflare = async (file) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${BASE_URL}upload/product-image`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json();

  if (!data.url) {
    throw new Error("Cloudflare upload failed");
  }

  return data.url;
};

const AdminAddProduct = ({ onDone }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    realPrice: "",
    price: "",
    discount: "",
    category: "",
    brand: "",
    isDiscounted: false,
    limitedTimeDeal: false,
    weeklyDeal: false,

    // 🖤 NEW FIELD: for Black Friday offer checkbox
    blackFridayOffer: false,

    weight: "",
    dimensions: "",
    warranty: "",
    countryOfOrigin: "Malta",
    sku: "",
  });

  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([null, null, null, null]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const calcDiscount = (real, curr) => {
    if (!real || !curr || isNaN(real) || isNaN(curr) || Number(real) <= 0)
      return "";
    return (((real - curr) / real) * 100).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "realPrice" || name === "price"
        ? {
            discount: calcDiscount(
              name === "realPrice" ? value : prev.realPrice,
              name === "price" ? value : prev.price
            ),
          }
        : {}),
    }));
  };

  const handleVariantChange = (idx, field, value) => {
    setVariants((variants) =>
      variants.map((v, i) => {
        if (i !== idx) return v;
        const updated = { ...v, [field]: value };
        if (field === "realPrice" || field === "price") {
          updated.discount = calcDiscount(
            field === "realPrice" ? value : v.realPrice,
            field === "price" ? value : v.price
          );
        }
        return updated;
      })
    );
  };

  const addVariant = () =>
    setVariants([
      ...variants,
      {
        color: "",
        dimensions: "",
        stock: "",
        realPrice: "",
        price: "",
        discount: "",
      },
    ]);

  const removeVariant = (idx) =>
    setVariants(variants.filter((_, i) => i !== idx));

  const handleImageChange = (idx, file) => {
    const newImgs = [...images];
    newImgs[idx] = file;
    setImages(newImgs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const imageUrls = [];
      for (const img of images.filter(Boolean)) {
        const url = await uploadToCloudflare(img);

        imageUrls.push(url);
      }
      const productData = {
        ...form,
        realPrice: parseFloat(form.realPrice),
        price: parseFloat(form.price),
        discount: form.discount ? parseFloat(form.discount) : 0,
        variants: variants.filter(
          (v) => v.color && v.dimensions && v.stock && v.price
        ),
        images: imageUrls,
      };
      await axios.post(`${BASE_URL}products`, productData);
      if (onDone) onDone();
      else navigate("/admin/products");
    } catch (err) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name *"
          className="w-full border px-3 py-2"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description *"
          className="w-full border px-3 py-2"
          required
        />

        <div className="flex gap-2">
          <input
            name="realPrice"
            type="number"
            value={form.realPrice}
            onChange={handleChange}
            placeholder="Original/Old Price (€) *"
            className="w-full border px-3 py-2"
            required
            min={0}
            step="0.01"
          />
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Current Price (€) *"
            className="w-full border px-3 py-2"
            required
            min={0}
            step="0.01"
          />
          <input
            name="discount"
            type="number"
            value={form.discount}
            onChange={handleChange}
            placeholder="Discount %"
            className="border px-2 py-1 w-28"
            min={0}
            max={100}
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">Select category</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Fitness">Fitness</option>
            <option value="Gadgets">Gadgets</option>
            <option value="Shelving">Shelving</option>
            <option value="Tools">Tools</option>
            <option value="Camping">Camping</option>
            <option value="Car Accessories">Car Accessories</option>
          </select>
        </div>

        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand (optional)"
          className="w-full border px-3 py-2"
        />
        <input
          name="sku"
          value={form.sku}
          onChange={handleChange}
          placeholder="SKU/Code (optional)"
          className="w-full border px-3 py-2"
        />

        {/* Variants */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">
              Variants (color / dimensions / stock / old price / curr. price / discount):
            </label>
            <button
              type="button"
              className="text-blue-600 text-xs"
              onClick={addVariant}
            >
              + Add Variant
            </button>
          </div>
          {variants.map((v, i) => (
            <div className="flex gap-2 mb-1" key={i}>
              <input
                value={v.color}
                onChange={(e) =>
                  handleVariantChange(i, "color", e.target.value)
                }
                placeholder="Color"
                className="border px-2 py-1 w-1/6"
              />
              <input
                value={v.dimensions}
                onChange={(e) =>
                  handleVariantChange(i, "dimensions", e.target.value)
                }
                placeholder="Dimensions (e.g. 1.8m x 1m)"
                className="border px-2 py-1 w-1/6"
              />
              <input
                value={v.stock}
                type="number"
                min={0}
                onChange={(e) =>
                  handleVariantChange(i, "stock", e.target.value)
                }
                placeholder="Stock"
                className="border px-2 py-1 w-1/6"
              />
              <input
                value={v.realPrice || ""}
                type="number"
                min={0}
                step="0.01"
                onChange={(e) =>
                  handleVariantChange(i, "realPrice", e.target.value)
                }
                placeholder="Old Price"
                className="border px-2 py-1 w-1/6"
              />
              <input
                value={v.price || ""}
                type="number"
                min={0}
                step="0.01"
                onChange={(e) =>
                  handleVariantChange(i, "price", e.target.value)
                }
                placeholder="Curr. Price"
                className="border px-2 py-1 w-1/6"
              />
              <input
                value={v.discount || ""}
                type="number"
                min={0}
                max={100}
                readOnly
                placeholder="%"
                className="border px-2 py-1 w-1/6"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="text-red-600 text-xs ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* DEAL FLAGS */}
        <div className="flex gap-3 flex-wrap">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="limitedTimeDeal"
              checked={form.limitedTimeDeal}
              onChange={handleChange}
              className="accent-blue-500"
            />
            <span>Limited Time Deal</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="weeklyDeal"
              checked={form.weeklyDeal}
              onChange={handleChange}
              className="accent-blue-500"
            />
            <span>Weekly Deal</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isDiscounted"
              checked={form.isDiscounted}
              onChange={handleChange}
              className="accent-blue-500"
            />
            <span>Show in Discount Section</span>
          </label>

          {/* 🖤 NEW BLACK FRIDAY CHECKBOX */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="blackFridayOffer"
              checked={form.blackFridayOffer}
              onChange={handleChange}
              className="accent-yellow-400"
            />
            <span>Show in Black Friday Page</span>
          </label>
        </div>

        {/* IMAGE UPLOAD */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n}>
              <label className="block mb-1 font-medium text-sm">
                Image {n} {n === 1 && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(n - 1, e.target.files[0])}
                className="block w-full"
                required={n === 1}
              />
            </div>
          ))}
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AdminAddProduct;
