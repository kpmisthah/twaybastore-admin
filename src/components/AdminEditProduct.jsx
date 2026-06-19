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

  const res = await fetch(`${BASE_URL}/upload/product-image`, {
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
    subCategory: "",
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
    productCode: "",
    description: "",
    images: [],
    variants: [],
    offerDuration: "", // NEW
    locations: { downstairs: "", upstairs: "", store: "", garage: "" },
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/products/${id}`)
      .then((res) => {
        setForm({
          ...res.data,
          subCategory: res.data.subCategory || "",
          realPrice: res.data.realPrice?.toString() || "",
          price: res.data.price?.toString() || "",
          discount: res.data.discount?.toString() || "",
          blackFridayOffer: res.data.blackFridayOffer || false, // 🖤 Added
          images: Array.isArray(res.data.images) ? res.data.images : [],
          locations: res.data.locations || { downstairs: "", upstairs: "", store: "", garage: "" },
        });
        setVariants(
          Array.isArray(res.data.variants)
            ? res.data.variants.map((v) => ({
              ...v,
              realPrice: v.realPrice?.toString() || "",
              price: v.price?.toString() || "",
              discount: v.discount?.toString() || "",
              stock: v.stock?.toString() || "",
              locations: v.locations || { downstairs: "", upstairs: "", store: "", garage: "" },
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
    
    if (["downstairs", "upstairs", "store", "garage"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        locations: {
          ...prev.locations,
          [name]: value
        }
      }));
      setSuccess(false);
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
    setSuccess(false);
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
      { color: "", stock: "", locations: { downstairs: "", upstairs: "", store: "", garage: "" }, realPrice: "", price: "", discount: "" },
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
        locations: {
          downstairs: parseInt(form.locations?.downstairs) || 0,
          upstairs: parseInt(form.locations?.upstairs) || 0,
          store: parseInt(form.locations?.store) || 0,
          garage: parseInt(form.locations?.garage) || 0,
        },
        variants: variants
          .filter((v) => v.color && v.price)
          .map((v) => ({
            ...v,
            realPrice: v.realPrice ? parseFloat(v.realPrice) : undefined,
            price: v.price ? parseFloat(v.price) : undefined,
            discount: v.discount ? parseFloat(v.discount) : undefined,
            locations: {
              downstairs: parseInt(v.locations?.downstairs) || 0,
              upstairs: parseInt(v.locations?.upstairs) || 0,
              store: parseInt(v.locations?.store) || 0,
              garage: parseInt(v.locations?.garage) || 0,
            },
            stock: (parseInt(v.locations?.downstairs) || 0) + (parseInt(v.locations?.upstairs) || 0) + (parseInt(v.locations?.store) || 0) + (parseInt(v.locations?.garage) || 0)
          })),
        images: form.images.filter(Boolean),
        offerExpiry: form.offerDuration
          ? new Date(Date.now() + parseInt(form.offerDuration) * 24 * 60 * 60 * 1000)
          : form.offerExpiry,
      };
      await axios.put(`${BASE_URL}/products/${id}`, payload);
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

        <div>
          <label className="block text-sm font-medium mb-1">Sub Category</label>
          <input
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            placeholder="Sub Category (optional)"
            className="w-full border px-3 py-2 rounded"
            disabled={updating}
          />
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
          placeholder="SKU"
          className="w-full border px-3 py-2"
          disabled={updating}
        />
        <input
          name="productCode"
          value={form.productCode}
          onChange={handleChange}
          placeholder="Unique Product Code (for Google Sheets sync) (optional)"
          className="w-full border px-3 py-2"
          disabled={updating}
        />

        {variants.length === 0 && (
          <div className="bg-gray-50 p-3 rounded border">
            <label className="font-medium text-sm mb-2 block">Inventory Locations (Base Stock)</label>
            <div className="grid grid-cols-4 gap-2">
              <input
                name="downstairs"
                type="number"
                min={0}
                value={form.locations?.downstairs || ""}
                onChange={handleChange}
                placeholder="Downstairs"
                className="border px-2 py-1 w-full"
                disabled={updating}
              />
              <input
                name="upstairs"
                type="number"
                min={0}
                value={form.locations?.upstairs || ""}
                onChange={handleChange}
                placeholder="Upstairs"
                className="border px-2 py-1 w-full"
                disabled={updating}
              />
              <input
                name="store"
                type="number"
                min={0}
                value={form.locations?.store || ""}
                onChange={handleChange}
                placeholder="Store"
                className="border px-2 py-1 w-full"
                disabled={updating}
              />
              <input
                name="garage"
                type="number"
                min={0}
                value={form.locations?.garage || ""}
                onChange={handleChange}
                placeholder="Garage"
                className="border px-2 py-1 w-full"
                disabled={updating}
              />
            </div>
            <div className="mt-2 text-sm font-semibold">
              Total Stock: {
                (parseInt(form.locations?.downstairs) || 0) +
                (parseInt(form.locations?.upstairs) || 0) +
                (parseInt(form.locations?.store) || 0) +
                (parseInt(form.locations?.garage) || 0)
              }
            </div>
          </div>
        )}

        <div className="mb-3 text-gray-700">
          <span className="font-medium">Total Global Stock:</span> {totalStock || (
            (parseInt(form.locations?.downstairs) || 0) +
            (parseInt(form.locations?.upstairs) || 0) +
            (parseInt(form.locations?.store) || 0) +
            (parseInt(form.locations?.garage) || 0)
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium text-sm">Product Variants:</label>
            <button
              type="button"
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-200"
              onClick={addVariant}
              disabled={updating}
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
                disabled={updating}
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
                  disabled={updating}
                />
                <input
                  value={v.dimensions || ""}
                  onChange={(e) =>
                    handleVariantChange(i, "dimensions", e.target.value)
                  }
                  placeholder="Dimensions"
                  className="border px-2 py-1 w-full text-sm"
                  disabled={updating}
                />
                <input
                  value={v.realPrice}
                  type="number"
                  min={0}
                  step="0.01"
                  onChange={(e) =>
                    handleVariantChange(i, "realPrice", e.target.value)
                  }
                  placeholder="Old Price"
                  className="border px-2 py-1 w-full text-sm"
                  disabled={updating}
                />
                <input
                  value={v.price}
                  type="number"
                  min={0}
                  step="0.01"
                  onChange={(e) =>
                    handleVariantChange(i, "price", e.target.value)
                  }
                  placeholder="Curr. Price"
                  className="border px-2 py-1 w-full text-sm"
                  disabled={updating}
                />
                <input
                  value={v.discount}
                  type="number"
                  min={0}
                  max={100}
                  readOnly
                  placeholder="Disc %"
                  className="border px-2 py-1 w-full text-sm bg-gray-100"
                  disabled={updating}
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
                    disabled={updating}
                  />
                  <input
                    value={v.locations?.upstairs || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "upstairs", e.target.value)}
                    placeholder="Upstairs"
                    className="border px-2 py-1 w-full text-sm"
                    title="Upstairs"
                    disabled={updating}
                  />
                  <input
                    value={v.locations?.store || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "store", e.target.value)}
                    placeholder="Store"
                    className="border px-2 py-1 w-full text-sm"
                    title="Store"
                    disabled={updating}
                  />
                  <input
                    value={v.locations?.garage || ""}
                    type="number"
                    min={0}
                    onChange={(e) => handleVariantChange(i, "garage", e.target.value)}
                    placeholder="Garage"
                    className="border px-2 py-1 w-full text-sm"
                    title="Garage"
                    disabled={updating}
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

        {form.weeklyDeal && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              Update Offer Duration (1-7 Days Manual)
            </label>
            {form.offerExpiry && new Date(form.offerExpiry) > new Date() && (
              <p className="text-xs text-green-700 mb-2">
                Active offer ends on:{" "}
                <span className="font-bold">
                  {new Date(form.offerExpiry).toLocaleString()}
                </span>
              </p>
            )}
            <select
              name="offerDuration"
              value={form.offerDuration}
              onChange={handleChange}
              className="w-full border border-blue-200 px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
              disabled={updating}
            >
              <option value="">Keep current / No specific end...</option>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  Reset to {d} Day{d > 1 ? "s" : ""} from now
                </option>
              ))}
            </select>
            <p className="text-[11px] text-blue-600 mt-1 italic">
              * Selecting a duration will overwrite the current expiry date.
            </p>
          </div>
        )}

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
