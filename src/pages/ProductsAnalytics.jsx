import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";

const ProductsAnalytics = () => {
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get all products
        const productsRes = await axios.get(`${BASE_URL}/products`);
        const products = productsRes.data || [];
        const productMap = {};
        products.forEach((p) => (productMap[p._id] = p));

        // Get all orders
        const ordersRes = await axios.get(`${BASE_URL}/orders`);
        const orders = ordersRes.data || [];

        // Count product sales
        const soldCounts = {};
        orders.forEach((order) => {
          order.items.forEach((item) => {
            const productId = item.product?._id || item.product;
            const qty = Number(item.quantity) || 0;
            if (!soldCounts[productId]) soldCounts[productId] = 0;
            soldCounts[productId] += qty;
          });
        });

        // Prepare sorted product sales
        const sorted = Object.entries(soldCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([productId, quantity]) => {
            const product = productMap[productId];
            if (!product) return null;
            return {
              ...product,
              sold: quantity,
            };
          })
          .filter(Boolean);

        setMostSold(sorted);
      } catch (err) {
        console.error("Error fetching product analytics", err);
        setMostSold([]);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Product Analytics</h1>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Product Name</th>
                <th className="text-left py-2 px-4">Sold Quantity</th>
              </tr>
            </thead>
            <tbody>
              {mostSold.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-4">{product.name}</td>
                  <td className="py-2 px-4">{product.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {mostSold.length === 0 && (
            <div className="text-gray-500 mt-4">No products sold yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsAnalytics;
