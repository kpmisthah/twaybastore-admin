import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [adjusting, setAdjusting] = useState({});
  const [quantity, setQuantity] = useState({});
  const [snack, setSnack] = useState(null);
  const [operation, setOperation] = useState("minus");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState({
    open: false,
    prod: null,
    variant: null,
    qty: 1,
    action: "minus",
    key: "",
  });

  // Load products
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/products?limit=1000`)
      .then((res) => {
        // Handle paginated response - products are in .products property
        const productsData = res.data.products || res.data;
        const data = Array.isArray(productsData) ? productsData : [];
        setProducts(data);
      })
      .catch((error) => {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter products by search
  const productsArray = Array.isArray(products) ? products : [];
  const filteredProducts = productsArray.filter((prod) =>
    prod.name?.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Handle after confirm dialog
  const doStockUpdate = async (productId, variantId, qty, op, key) => {
    setAdjusting((a) => ({ ...a, [key]: true }));
    try {
      let endpoint, data;
      if (op === "add") {
        endpoint = `${BASE_URL}/admin/products/${productId}/add-stock`;
        data = { quantity: qty, variantId };
      } else {
        endpoint = `${BASE_URL}/admin/products/${productId}/adjust-stock`;
        data = { quantity: qty, variantId };
      }
      await axios.patch(endpoint, data);
      const res = await axios.get(`${BASE_URL}/products`);
      setProducts(res.data);
      setQuantity((q) => ({ ...q, [key]: 1 }));
      setSnack({
        msg: `Stock ${op === "minus" ? "reduced" : "added"}!`,
        type: "info",
      });
    } catch (e) {
      setSnack({
        msg: e?.response?.data?.message || "Failed to adjust stock",
        type: "error",
      });
    } finally {
      setAdjusting((a) => ({ ...a, [key]: false }));
      setConfirm({
        open: false,
        prod: null,
        variant: null,
        qty: 1,
        action: op,
        key: "",
      });
    }
  };

  // For counter defaults (avoid undefined)
  const getQty = (key) => quantity[key] || 1;

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-2 md:px-0">
      <div className="max-w-6xl mx-auto p-4 md:p-8 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-extrabold mb-6 tracking-tight text-gray-800">
          Inventory Management
        </h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search product by name..."
            className="w-full max-w-2xl px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-blue-400 bg-gray-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 mb-6">
          <button
            className={`px-5 py-2 rounded-xl font-semibold transition ${operation === "minus"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            onClick={() => setOperation("minus")}
          >
            Minus Stock
          </button>
          <button
            className={`px-5 py-2 rounded-xl font-semibold transition ${operation === "add"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            onClick={() => setOperation("add")}
          >
            Add Stock
          </button>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
            <div className="text-xl font-bold text-gray-600">Loading...</div>
          </div>
        )}
        <div className="space-y-8">
          {filteredProducts.length === 0 && !loading ? (
            <div className="text-center text-gray-400 py-10">
              No products found.
            </div>
          ) : (
            filteredProducts.map((prod) => (
              <div
                key={prod._id}
                className="bg-gray-100 rounded-2xl p-4 md:p-6 shadow flex flex-col md:flex-row md:items-center gap-4 border-b-2 border-gray-200"
              >
                <img
                  src={prod.images?.[0]}
                  alt={prod.name}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-xl border flex-shrink-0 bg-white"
                  style={{ background: "#fff" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xl truncate">
                    {prod.name}
                  </div>

                  {prod.variants?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="font-semibold text-base mb-2 text-gray-700">
                        Variants:
                      </div>
                      {prod.variants.map((v) => {
                        const key = `${prod._id}_${v._id}`;
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-4 text-base"
                          >
                            <span>
                              {v.color && (
                                <span className="mr-1 px-2 py-0.5 bg-gray-200 rounded">
                                  {v.color}
                                </span>
                              )}
                              {v.size && (
                                <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded">
                                  Size: {v.size}
                                </span>
                              )}
                              <span className="ml-2 text-gray-500">
                                Stock: <b>{v.stock}</b>
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                ID: {v._id.slice(-5)}
                              </span>
                            </span>
                            <Counter
                              value={getQty(key)}
                              setValue={(v2) =>
                                setQuantity((q) => ({ ...q, [key]: v2 }))
                              }
                              disabled={!!adjusting[key]}
                            />
                            <button
                              className={`px-4 py-1 rounded-lg font-semibold shadow transition-all ${operation === "minus"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-600 hover:bg-green-700"
                                } text-white disabled:opacity-50`}
                              disabled={!!adjusting[key]}
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  prod,
                                  variant: v,
                                  qty: getQty(key),
                                  action: operation,
                                  key,
                                })
                              }
                            >
                              {adjusting[key]
                                ? "Updating..."
                                : `${operation === "minus"
                                  ? "Minus Variant"
                                  : "Add Variant"
                                }`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Confirm dialog */}
        <ConfirmDialog
          open={confirm.open}
          prod={confirm.prod}
          variant={confirm.variant}
          qty={confirm.qty}
          action={confirm.action}
          onCancel={() =>
            setConfirm({
              open: false,
              prod: null,
              variant: null,
              qty: 1,
              action: operation,
              key: "",
            })
          }
          onConfirm={() =>
            doStockUpdate(
              confirm.prod?._id,
              confirm.variant?._id,
              confirm.qty,
              confirm.action,
              confirm.key
            )
          }
        />
        {snack && <Snack {...snack} onClose={() => setSnack(null)} />}
      </div>
    </div>
  );
};

const Counter = ({ value, setValue, disabled }) => (
  <div className="flex items-center gap-2">
    <button
      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 bg-white hover:bg-gray-50 focus:outline-none"
      onClick={() => setValue(Math.max(1, value - 1))}
      disabled={disabled}
    >
      -
    </button>
    <div className="w-12 text-center font-medium bg-white px-2 py-1 border rounded-md">
      {value}
    </div>
    <button
      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-600 bg-white hover:bg-gray-50 focus:outline-none"
      onClick={() => setValue(value + 1)}
      disabled={disabled}
    >
      +
    </button>
  </div>
);

const ConfirmDialog = ({
  open,
  prod,
  variant,
  qty,
  action,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Confirm Stock Update</h3>
        <p className="text-gray-700 mb-6">
          Are you sure you want to{" "}
          <span className="font-bold">
            {action === "add" ? "ADD" : "REMOVE"}
          </span>{" "}
          <span className="bg-blue-100 text-blue-800 px-2 rounded-md font-mono">
            {qty}
          </span>{" "}
          items for <span className="italic">{prod?.name}</span> (
          {variant?.color || "Regular"})?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white ${action === "add"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
              }`}
          >
            Yes, {action === "add" ? "Add" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Snack = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-bounce ${type === "error" ? "bg-red-600" : "bg-blue-600"
        }`}
    >
      {msg}
    </div>
  );
};

export default Inventory;
