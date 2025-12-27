import React, { useEffect, useState } from "react";
import axios from "axios";

import BASE_URL from "../api/configadmin";
const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const API_URL = `${BASE_URL}/users`;

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
    setLoading(false);
  }

  const handleBan = async (id) => {
    const reason = prompt("Enter ban reason:");
    if (!reason) return;
    try {
      await axios.put(`${API_URL}/ban/${id}`, { reason });
      alert("User banned successfully");
      fetchUsers();
    } catch (err) {
      alert("Failed to ban user");
    }
  };

  const handleUnban = async (id) => {
    try {
      await axios.put(`${API_URL}/unban/${id}`);
      alert("User unbanned successfully");
      fetchUsers();
    } catch (err) {
      alert("Failed to unban user");
    }
  };

  // 🔵 FIXED EXPORT CSV FOR GOOGLE ADS + GOOGLE SHEETS
  const exportCSV = () => {
    if (users.length === 0) {
      alert("No users to export.");
      return;
    }

    const headers = [
      "Email",
      "Phone",
      "First Name",
      "Last Name",
      "Country",
      "Zip"
    ];

    const rows = users.map((u) => {
      const fullName = u.fullName || "";
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      return [
        u.email || "",
        u.mobile || "",
        firstName,
        lastName,
        "MT",
        ""
      ];
    });

    const csvArray = [];
    csvArray.push(headers.join(","));
    rows.forEach((r) => csvArray.push(r.map((v) => `"${v}"`).join(",")));

    const csvString = csvArray.join("\n");

    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twayba-leads.csv";
    a.click();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile?.includes(search);

    const matchesDate = filterDate
      ? new Date(u.createdAt).toISOString().slice(0, 10) === filterDate
      : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            All Registered Users
          </h1>

          {/* Export Button */}
          <button
            onClick={exportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Export CSV for Google Ads
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="w-full sm:w-1/2 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            type="date"
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-gray-600">Loading users...</div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700 uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Date Registered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr
                    key={user._id}
                    className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50`}
                  >
                    <td className="py-3 px-4">{user.fullName}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.mobile}</td>
                    <td className="py-3 px-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td
                      className={`py-3 px-4 font-medium ${user.isBanned ? "text-red-600" : "text-green-600"
                        }`}
                    >
                      {user.isBanned ? "Banned" : "Active"}
                    </td>

                    <td className="py-3 px-4">
                      {user.isBanned ? (
                        <button
                          onClick={() => handleUnban(user._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(user._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-gray-500 p-6 text-center">
                No users found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
