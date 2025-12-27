import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

const ADMIN_URL = "https://twayba-backend-oln6.onrender.com/admin/";
// const ADMIN_URL = "https://twayba-backend-oln6.onrender.com/admin/";


const Snack = ({ msg, onClose, type = "info" }) => (
  <div
    className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-xl text-white ${
      type === "error" ? "bg-red-600" : "bg-green-600"
    }`}
  >
    {msg}
    <button onClick={onClose} className="ml-4 underline">
      Close
    </button>
  </div>
);

// Confirm dialog for stock operations
const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  action,
  qty,
  prod,
  variant,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-6 max-w-xs w-full">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          Confirm {action === "add" ? "Addition" : "Reduction"}
        </h3>
        <div className="text-gray-700 text-base mb-4">
          Product: <span className="font-medium">{prod?.name}</span>
          <br />
          {variant && (
            <>
              Variant:{" "}
              <span className="font-medium">
                {variant.color || ""}{" "}
                {variant.size ? `Size: ${variant.size}` : ""}
              </span>
              <br />
            </>
          )}
          {action === "add" ? "Add" : "Minus"} <b>{qty}</b>{" "}
          {variant ? "variant" : "main"} stock?
        </div>
        <div className="text-xs text-gray-400 mb-4">
          <pre className="bg-gray-100 rounded p-2 overflow-x-auto">
            {JSON.stringify(
              {
                productId: prod?._id,
                variantId: variant?._id,
                quantity: qty,
                operation: action,
              },
              null,
              2
            )}
          </pre>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-1 rounded text-white ${
              action === "add"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Counter component (no stale closure issue, always shows valid count)
const Counter = ({ value, setValue, disabled }) => {
  const safeValue = Number.isNaN(Number(value)) || !value ? 1 : Number(value);
  return (
    <div className="flex items-center gap-2">
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-xl hover:bg-gray-200 font-bold transition"
        disabled={disabled || safeValue <= 1}
        onClick={() => setValue(Math.max(1, safeValue - 1))}
        type="button"
      >
        -
      </button>
      <input
        className="border border-gray-300 rounded-lg text-center w-14 h-9 font-bold text-black focus:ring-2 focus:ring-blue-400 outline-none transition-all bg-white"
        type="number"
        min={1}
        value={safeValue}
        style={{ color: "#222", background: "#fff" }}
        onChange={(e) => {
          let newVal = Number(e.target.value);
          if (!newVal || newVal < 1) newVal = 1;
          setValue(newVal);
        }}
        disabled={disabled}
      />
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-xl hover:bg-gray-200 font-bold transition"
        disabled={disabled}
        onClick={() => setValue(safeValue + 1)}
        type="button"
      >
        +
      </button>
    </div>
  );
};

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
      .get(`${BASE_URL}products`)
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Filter products by search
  const filteredProducts = products.filter((prod) =>
    prod.name?.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Handle after confirm dialog
  const doStockUpdate = async (productId, variantId, qty, op, key) => {
    setAdjusting((a) => ({ ...a, [key]: true }));
    try {
      let endpoint, data;
      if (op === "add") {
        endpoint = `${ADMIN_URL}products/${productId}/add-stock`;
        data = { quantity: qty, variantId };
      } else {
        endpoint = `${ADMIN_URL}products/${productId}/adjust-stock`;
        data = { quantity: qty, variantId };
      }
      await axios.patch(endpoint, data);
      const res = await axios.get(`${BASE_URL}products`);
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
            className={`px-5 py-2 rounded-xl font-semibold transition ${
              operation === "minus"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setOperation("minus")}
          >
            Minus Stock
          </button>
          <button
            className={`px-5 py-2 rounded-xl font-semibold transition ${
              operation === "add"
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
                              className={`px-4 py-1 rounded-lg font-semibold shadow transition-all ${
                                operation === "minus"
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
                                : `${
                                    operation === "minus"
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

export default Inventory;
