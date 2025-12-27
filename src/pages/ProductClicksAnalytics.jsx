import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";

const ProductClicksAnalytics = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = most clicked
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await axios.get(`${BASE_URL}/products`);
        setProducts(res.data || []);
      } catch (err) {
        console.error("Error loading product clicks", err);
        setProducts([]);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  // Filter + sort logic
  const filteredProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) =>
      sortOrder === "desc"
        ? (b.clickCount || 0) - (a.clickCount || 0)
        : (a.clickCount || 0) - (b.clickCount || 0)
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          📊 Product Click Analytics
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {/* Sort filter */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="desc">Most Clicked First</option>
            <option value="asc">Least Clicked First</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products…</div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Click Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product._id}
                    className={`transition hover:bg-indigo-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {product.clickCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductClicksAnalytics;
