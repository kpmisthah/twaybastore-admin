import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../api/config";

const uploadToCloudflare = async (file) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${BASE_URL}/upload/product-image`, {
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
    subCategory: "",
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
    offerDuration: "", // NEW: 1-7 days
    woltId: "",
    locations: { downstairs: "", upstairs: "", store: "", garage: "" },
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
    
    if (["downstairs", "upstairs", "store", "garage"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        locations: {
          ...prev.locations,
          [name]: value
        }
      }));
      return;
    }

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
        const updated = { ...v };
        if (["downstairs", "upstairs", "store", "garage"].includes(field)) {
          updated.locations = { ...updated.locations, [field]: value };
          updated.stock = (parseInt(updated.locations.downstairs) || 0) + (parseInt(updated.locations.upstairs) || 0) + (parseInt(updated.locations.store) || 0) + (parseInt(updated.locations.garage) || 0);
        } else {
          updated[field] = value;
        }
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
        locations: { downstairs: "", upstairs: "", store: "", garage: "" },
        realPrice: "",
        price: "",
        discount: "",
        woltId: "",
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
        locations: {
          downstairs: parseInt(form.locations.downstairs) || 0,
          upstairs: parseInt(form.locations.upstairs) || 0,
          store: parseInt(form.locations.store) || 0,
          garage: parseInt(form.locations.garage) || 0,
        },
        variants: variants.filter(
          (v) => v.color && v.dimensions && v.price
        ).map(v => ({
          ...v,
          locations: {
            downstairs: parseInt(v.locations?.downstairs) || 0,
            upstairs: parseInt(v.locations?.upstairs) || 0,
            store: parseInt(v.locations?.store) || 0,
            garage: parseInt(v.locations?.garage) || 0,
          },
          stock: (parseInt(v.locations?.downstairs) || 0) + (parseInt(v.locations?.upstairs) || 0) + (parseInt(v.locations?.store) || 0) + (parseInt(v.locations?.garage) || 0)
        })),
        images: imageUrls,
        offerExpiry: form.offerDuration
          ? new Date(Date.now() + parseInt(form.offerDuration) * 24 * 60 * 60 * 1000)
          : undefined,
      };
      await axios.post(`${BASE_URL}/products`, productData);
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

        <div>
          <label className="block text-sm font-medium mb-1">Sub Category</label>
          <input
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            placeholder="Sub Category (optional)"
            className="w-full border px-3 py-2 rounded"
          />
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
          placeholder="SKU"
          className="w-full border px-3 py-2"
        />
        <input
          name="productCode"
          value={form.productCode}
          onChange={handleChange}
          placeholder="Unique Product Code (for Google Sheets sync) (optional)"
          className="w-full border px-3 py-2"
        />
        <input
          name="woltId"
          value={form.woltId}
          onChange={handleChange}
          placeholder="Wolt ID (optional)"
          className="w-full border px-3 py-2"
        />

        {/* Location Stock for Product without variants */}
        {variants.length === 0 && (
          <div className="bg-gray-50 p-3 rounded border">
            <label className="font-medium text-sm mb-2 block">Inventory Locations (Base Stock)</label>
            <div className="grid grid-cols-4 gap-2">
              <input
                name="downstairs"
                type="number"
                min={0}
                value={form.locations.downstairs}
                onChange={handleChange}
                placeholder="Downstairs"
                className="border px-2 py-1 w-full"
              />
              <input
                name="upstairs"
                type="number"
                min={0}
                value={form.locations.upstairs}
                onChange={handleChange}
                placeholder="Upstairs"
                className="border px-2 py-1 w-full"
              />
              <input
                name="store"
                type="number"
                min={0}
                value={form.locations.store}
                onChange={handleChange}
                placeholder="Store"
                className="border px-2 py-1 w-full"
              />
              <input
                name="garage"
                type="number"
                min={0}
                value={form.locations.garage}
                onChange={handleChange}
                placeholder="Garage"
                className="border px-2 py-1 w-full"
              />
            </div>
            <div className="mt-2 text-sm font-semibold">
              Total Stock: {
                (parseInt(form.locations.downstairs) || 0) +
                (parseInt(form.locations.upstairs) || 0) +
                (parseInt(form.locations.store) || 0) +
                (parseInt(form.locations.garage) || 0)
              }
            </div>
          </div>
        )}

        {/* Variants */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium text-sm">
              Product Variants:
            </label>
            <button
              type="button"
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-200"
              onClick={addVariant}
            >
              + Add Variant
            </button>
          </div>
          {variants.map((v, i) => (
            <div className="bg-gray-50 p-3 rounded border mb-3 relative" key={i}>
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="absolute top-3 right-3 text-red-600 text-xs font-bold hover:underline"
              >
                Remove
              </button>
              
              <div className="grid grid-cols-5 gap-2 pr-16 mb-3">
                <input
                  value={v.color}
                  onChange={(e) =>
                    handleVariantChange(i, "color", e.target.value)
                  }
                  placeholder="Color"
                  className="border px-2 py-1 w-full text-sm"
                />
                <input
                  value={v.dimensions}
                  onChange={(e) =>
                    handleVariantChange(i, "dimensions", e.target.value)
                  }
                  placeholder="Dimensions"
                  className="border px-2 py-1 w-full text-sm"
                />
                <input
                  value={v.woltId || ""}
                  onChange={(e) =>
                    handleVariantChange(i, "woltId", e.target.value)
                  }
                  placeholder="Wolt ID"
                  className="border px-2 py-1 w-full text-sm"
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
                  className="border px-2 py-1 w-full text-sm"
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
                  className="border px-2 py-1 w-full text-sm"
                />
                <input
                  value={v.discount || ""}
                  type="number"
                  min={0}
                  max={100}
                  readOnly
                  placeholder="Disc %"
                  className="border px-2 py-1 w-full text-sm bg-gray-100"
                />
              </div>

              <div className="pt-2 border-t border-gray-200">
                <label className="font-medium text-xs text-gray-600 mb-1 block">Variant Inventory Locations</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    value={v.locations?.downstairs || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "downstairs", e.target.value)}
                    placeholder="Downstairs"
                    className="border px-2 py-1 w-full text-sm"
                    title="Downstairs"
                  />
                  <input
                    value={v.locations?.upstairs || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "upstairs", e.target.value)}
                    placeholder="Upstairs"
                    className="border px-2 py-1 w-full text-sm"
                    title="Upstairs"
                  />
                  <input
                    value={v.locations?.store || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "store", e.target.value)}
                    placeholder="Store"
                    className="border px-2 py-1 w-full text-sm"
                    title="Store"
                  />
                  <input
                    value={v.locations?.garage || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "garage", e.target.value)}
                    placeholder="Garage"
                    className="border px-2 py-1 w-full text-sm"
                    title="Garage"
                  />
                </div>
                <div className="text-xs text-gray-600 font-semibold mt-2">
                  Variant Total Stock: {
                    (parseInt(v.locations?.downstairs) || 0) + 
                    (parseInt(v.locations?.upstairs) || 0) + 
                    (parseInt(v.locations?.store) || 0) + 
                    (parseInt(v.locations?.garage) || 0)
                  }
                </div>
              </div>
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

        {/* 🕒 NEW: Offer Duration Selector */}
        {form.weeklyDeal && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              Offer Duration (1-7 Days Manual)
            </label>
            <select
              name="offerDuration"
              value={form.offerDuration}
              onChange={handleChange}
              className="w-full border border-blue-200 px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select duration...</option>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} Day{d > 1 ? "s" : ""} Offer
                </option>
              ))}
            </select>
            <p className="text-[11px] text-blue-600 mt-1 italic">
              * The countdown will start from the moment you click "Add Product".
            </p>
          </div>
        )}

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
                required={false}
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
