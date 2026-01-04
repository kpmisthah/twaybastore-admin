import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

// --- HOOK: useDebounce ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SKELETON_COUNT = 8;

function SkeletonAdminCard() {
  return (
    <div className="bg-[#fafbfc] border border-gray-200 rounded-xl overflow-hidden animate-pulse flex flex-col">
      <div className="relative w-full h-[180px] flex items-center justify-center bg-gray-100">
        <div className="h-[90px] w-[90px] bg-gray-200 rounded-xl" />
      </div>
      <div className="flex-1 flex flex-col px-4 pt-3 pb-4">
        <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-2/3 bg-gray-100 rounded mb-2" />
        <div className="mt-auto flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

const AdminProducts = ({ onEdit }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // 500ms delay to avoid API spam
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const LIMIT = 12;

  // Reset page to 1 whenever search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch products whenever page or debouncedSearch changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/products`, {
        params: {
          page: page,
          limit: LIMIT,
          q: debouncedSearch,
        },
      });

      // Response structure: { products: [...], pagination: { ... } }
      const data = res.data;
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.total || 0);
      } else {
        // Fallback if structure is different
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the product: "${name}"?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${BASE_URL}/products/${id}`);
      // Optimistic update: remove from UI immediately
      setProducts((prev) => prev.filter((p) => p._id !== id));
      // Optionally decrement total count locally
      setTotalProducts((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product");
    }
  };

  const handleEdit = (id, name) => {
    const confirmed = window.confirm(
      id
        ? `Do you want to edit the product: "${name}"?`
        : "Do you want to add a new product?"
    );
    if (confirmed) {
      onEdit(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
            Products Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Total Products: {totalProducts}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div
        className="
          grid gap-5 sm:gap-6
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
        "
      >
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonAdminCard key={i} />
          ))
          : products.map((prod) => (
            <div
              key={prod._id}
              className="group bg-[#fafbfc] transition hover:shadow-md border border-gray-200 hover:scale-[1.02] flex flex-col rounded-xl overflow-hidden"
            >
              {/* Image */}
              <div className="relative flex-shrink-0 w-full h-[180px] flex items-center justify-center bg-white">
                <img
                  src={
                    (prod.images && prod.images[0]) ||
                    prod.image ||
                    "/default-product.png"
                  }
                  alt={prod.name}
                  className="object-contain max-h-[160px] w-full transition group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="flex-1 w-full flex flex-col px-4 pt-3 pb-4">
                <h3 className="text-base font-semibold mb-1 line-clamp-2 min-h-[42px]">
                  {prod.name}
                </h3>
                <p className="text-gray-500 text-xs mb-2 line-clamp-2 min-h-[32px]">
                  {prod.description}
                </p>
                <div className="mt-auto">
                  <div className="text-gray-800 font-bold text-lg mb-1">
                    €{prod.price}
                  </div>
                  <div className="text-gray-600 text-xs mb-2">
                    {prod.category || "-"} | Stock: {prod.stock}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(prod._id, prod.name)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prod._id, prod.name)}
                      className="text-red-600 hover:text-red-800 font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="flex items-center justify-center h-[250px]">
          <div className="text-center text-gray-400 text-lg mt-12">
            No products found matching "{search}".
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
