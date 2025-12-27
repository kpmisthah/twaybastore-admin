import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

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
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}products`)
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the product: "${name}"?`
    );
    if (!confirmed) return;

    await axios.delete(`${BASE_URL}products/${id}`);
    setProducts((prev) => prev.filter((p) => p._id !== id));
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

  const filteredProducts = products.filter((prod) =>
    [prod.name, prod.category, prod.description]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
          Products Management
        </h1>
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
          : filteredProducts.map((prod) => (
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

      {/* Empty state */}
      {!loading && filteredProducts.length === 0 && (
        <div className="flex items-center justify-center h-[250px]">
          <div className="text-center text-gray-400 text-lg mt-12">
            No products found.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
