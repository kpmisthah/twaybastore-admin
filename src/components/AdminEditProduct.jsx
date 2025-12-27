import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

const categoryOptions = [
  "Home & Kitchen",
  "Fitness",
  "Gadgets",
  "Shelving",
  "Tools",
  "Camping",
  "Car Accessories",
];

const uploadToCloudflare = async (file) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${BASE_URL}upload/product-image`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error("Cloudflare upload failed");
  }

  const data = await res.json();
  return data.url;
};

const calcDiscount = (real, curr) => {
  if (!real || !curr || isNaN(real) || isNaN(curr) || Number(real) <= 0)
    return "";
  return (((real - curr) / real) * 100).toFixed(2);
};

const AdminEditProduct = ({ id, onDone }) => {
  const [form, setForm] = useState({
    name: "",
    realPrice: "",
    price: "",
    discount: "",
    category: "",
    brand: "",
    isDiscounted: false,
    limitedTimeDeal: false,
    weeklyDeal: false,
    blackFridayOffer: false, // 🖤 Added
    weight: "",
    dimensions: "",
    warranty: "",
    countryOfOrigin: "",
    sku: "",
    description: "",
    images: [],
    variants: [],
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}products/${id}`)
      .then((res) => {
        setForm({
          ...res.data,
          realPrice: res.data.realPrice?.toString() || "",
          price: res.data.price?.toString() || "",
          discount: res.data.discount?.toString() || "",
          blackFridayOffer: res.data.blackFridayOffer || false, // 🖤 Added
          images: Array.isArray(res.data.images) ? res.data.images : [],
        });
        setVariants(
          Array.isArray(res.data.variants)
            ? res.data.variants.map((v) => ({
                ...v,
                realPrice: v.realPrice?.toString() || "",
                price: v.price?.toString() || "",
                discount: v.discount?.toString() || "",
                stock: v.stock?.toString() || "",
              }))
            : []
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const totalStock = variants.reduce(
    (sum, v) => sum + (parseInt(v.stock, 10) || 0),
    0
  );

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
    setSuccess(false);
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
      { color: "", stock: "", realPrice: "", price: "", discount: "" },
    ]);

  const removeVariant = (idx) =>
    setVariants(variants.filter((_, i) => i !== idx));

 const handleImageChange = async (idx, file) => {
  if (!file) return;
  try {
    const url = await uploadToCloudflare(file);
    setForm((f) => {
      const imgs = [...f.images];
      imgs[idx] = url;
      return { ...f, images: imgs };
    });
  } catch (e) {
    alert("Image upload failed");
  }
};

  const handleRemoveImage = (idx) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((img, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        ...form,
        realPrice: parseFloat(form.realPrice),
        price: parseFloat(form.price),
        discount: form.discount ? parseFloat(form.discount) : 0,
        variants: variants
          .filter((v) => v.color && v.stock && v.price)
          .map((v) => ({
            ...v,
            realPrice: v.realPrice ? parseFloat(v.realPrice) : undefined,
            price: v.price ? parseFloat(v.price) : undefined,
            discount: v.discount ? parseFloat(v.discount) : undefined,
            stock: v.stock ? parseInt(v.stock, 10) : 0,
          })),
        images: form.images.filter(Boolean),
      };
      await axios.put(`${BASE_URL}products/${id}`, payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onDone();
      }, 1200);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[30vh] text-gray-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Edit Product</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white shadow p-6 rounded"
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name *"
          className="w-full border px-3 py-2"
          required
          disabled={updating}
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description *"
          className="w-full border px-3 py-2"
          required
          disabled={updating}
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
            disabled={updating}
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
            disabled={updating}
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
            disabled={updating}
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
            disabled={updating}
          >
            <option value="">Select category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand"
          className="w-full border px-3 py-2"
          disabled={updating}
        />
        <input
          name="sku"
          value={form.sku}
          onChange={handleChange}
          placeholder="SKU/Code"
          className="w-full border px-3 py-2"
          disabled={updating}
        />

        <div className="mb-3 text-gray-700">
          <span className="font-medium">Total Stock:</span> {totalStock}
        </div>

        {/* Variant management */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-medium text-sm">Variants:</label>
            <button
              type="button"
              className="text-blue-600 text-xs"
              onClick={addVariant}
              disabled={updating}
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
                disabled={updating}
              />
              <input
                value={v.dimensions || ""}
                onChange={(e) =>
                  handleVariantChange(i, "dimensions", e.target.value)
                }
                placeholder="Dimensions (e.g. 1.8m x 1m)"
                className="border px-2 py-1 w-1/6"
                disabled={updating}
              />
              <input
                value={v.stock}
                type="number"
                onChange={(e) =>
                  handleVariantChange(i, "stock", e.target.value)
                }
                placeholder="Stock"
                className="border px-2 py-1 w-1/6"
                disabled={updating}
              />
              <input
                value={v.realPrice}
                type="number"
                onChange={(e) =>
                  handleVariantChange(i, "realPrice", e.target.value)
                }
                placeholder="Old Price"
                className="border px-2 py-1 w-1/6"
                disabled={updating}
              />
              <input
                value={v.price}
                type="number"
                onChange={(e) =>
                  handleVariantChange(i, "price", e.target.value)
                }
                placeholder="Curr. Price"
                className="border px-2 py-1 w-1/6"
                disabled={updating}
              />
              <input
                value={v.discount}
                readOnly
                placeholder="%"
                className="border px-2 py-1 w-1/6"
                disabled={updating}
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="text-red-600 text-xs ml-2"
                disabled={updating}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Deal Flags */}
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="limitedTimeDeal"
              checked={form.limitedTimeDeal}
              onChange={handleChange}
              className="accent-blue-500"
              disabled={updating}
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
              disabled={updating}
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
              disabled={updating}
            />
            <span>Show in Discount Section</span>
          </label>

          {/* 🖤 New Black Friday Checkbox */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="blackFridayOffer"
              checked={form.blackFridayOffer}
              onChange={handleChange}
              className="accent-yellow-400"
              disabled={updating}
            />
            <span>Show in Black Friday Page</span>
          </label>
        </div>

        {/* Images */}
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {form.images[idx] && (
                <div className="relative group">
                  <img
                    src={form.images[idx]}
                    alt={`img-${idx + 1}`}
                    className="h-16 w-16 object-cover rounded border mb-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded px-1"
                    disabled={updating}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleImageChange(idx, e.target.files[0])
                }
                disabled={updating}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700"
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onDone}
            disabled={updating}
          >
            Cancel
          </button>
        </div>

        {success && <div className="text-green-600 mt-2">Product updated!</div>}
      </form>
    </div>
  );
};

export default AdminEditProduct;
