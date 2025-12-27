import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/config";

const PAGE_SIZE = 20;

const Chip = ({ kind = "neutral", children }) => {
  const styles = {
    neutral: "bg-gray-100 text-gray-800 border border-gray-200",
    good: "bg-green-100 text-green-800 border border-green-200",
    bad: "bg-red-100 text-red-800 border border-red-200",
    blue: "bg-blue-100 text-blue-800 border border-blue-200",
    slate: "bg-slate-100 text-slate-800 border border-slate-200",
    amber: "bg-amber-100 text-amber-800 border border-amber-200",
  }[kind];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
};

const AvailabilityBadge = ({ tag }) => {
  if (tag === "HAS_PRODUCT") return <Chip kind="good">Has product</Chip>;
  if (tag === "NO_PRODUCT") return <Chip kind="bad">Not found</Chip>;
  return <Chip>Unknown</Chip>;
};

const TypeBadge = ({ type }) => {
  if (type === "voice") return <Chip kind="amber">Voice</Chip>;
  if (type === "text") return <Chip kind="slate">Text</Chip>;
  return <Chip>Unknown</Chip>;
};

const LoadingRow = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="p-6 text-center text-gray-500">Loading…</td>
  </tr>
);

const EmptyRow = ({ colSpan, msg = "No results." }) => (
  <tr>
    <td colSpan={colSpan} className="p-6 text-center text-gray-400">{msg}</td>
  </tr>
);

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "-";
  }
};

const AdminVoiceSearches = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [availability, setAvailability] = useState("ALL"); // ALL | HAS_PRODUCT | NO_PRODUCT
  const [searchType, setSearchType] = useState("ALL"); // ALL | voice | text
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let done = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${BASE_URL}analytics/search?limit=400`);
        const data = Array.isArray(res.data?.items) ? res.data.items : [];
        // normalize
        const normalized = data.map((it) => ({
          id: it._id || it.id,
          type: it.type || "text",
          query: it.query || it.transcript || "",
          availabilityTag: it.availabilityTag || "UNKNOWN",
          count: typeof it.count === "number" ? it.count : null,
          pathname: it.pathname || "-",
          ua: it.ua || "",
          user: it.user || null,
          createdAt: it.createdAt,
        }));
        if (!done) setItems(normalized);
      } catch (e) {
        if (!done) setError(e?.response?.data?.message || "Failed to load searches");
      } finally {
        if (!done) setLoading(false);
      }
    };
    run();
    return () => { done = true; };
  }, []);

  // stats
  const stats = useMemo(() => {
    const has = items.filter((x) => x.availabilityTag === "HAS_PRODUCT").length;
    const missing = items.filter((x) => x.availabilityTag === "NO_PRODUCT").length;
    const voice = items.filter((x) => x.type === "voice").length;
    const text = items.filter((x) => x.type === "text").length;
    return { total: items.length, has, missing, voice, text };
  }, [items]);

  // filters
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    let arr = items;
    if (availability !== "ALL") {
      arr = arr.filter((it) => it.availabilityTag === availability);
    }
    if (searchType !== "ALL") {
      arr = arr.filter((it) => it.type === searchType);
    }
    if (qLower) {
      arr = arr.filter(
        (it) =>
          (it.query || "").toLowerCase().includes(qLower) ||
          (it.pathname || "").toLowerCase().includes(qLower)
      );
    }
    return arr.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, availability, searchType, q]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [availability, searchType, q]);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Search Insights</h1>
          <div className="mt-1 text-sm text-gray-600">
            Track user searches (voice & text) and whether your catalog has matches.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip kind="blue">Total: {stats.total}</Chip>
          <Chip kind="good">Has: {stats.has}</Chip>
          <Chip kind="bad">Missing: {stats.missing}</Chip>
          <Chip kind="amber">Voice: {stats.voice}</Chip>
          <Chip kind="slate">Text: {stats.text}</Chip>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type:</span>
          <button
            onClick={() => setSearchType("ALL")}
            className={`px-3 py-1.5 rounded border text-sm ${searchType === "ALL" ? "bg-black text-white border-black" : "border-gray-300 hover:bg-gray-50"}`}
          >
            All
          </button>
          <button
            onClick={() => setSearchType("voice")}
            className={`px-3 py-1.5 rounded border text-sm ${searchType === "voice" ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 hover:bg-gray-50"}`}
          >
            Voice
          </button>
          <button
            onClick={() => setSearchType("text")}
            className={`px-3 py-1.5 rounded border text-sm ${searchType === "text" ? "bg-slate-700 text-white border-slate-700" : "border-gray-300 hover:bg-gray-50"}`}
          >
            Text
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Availability:</span>
          <button
            onClick={() => setAvailability("ALL")}
            className={`px-3 py-1.5 rounded border text-sm ${availability === "ALL" ? "bg-black text-white border-black" : "border-gray-300 hover:bg-gray-50"}`}
          >
            All
          </button>
          <button
            onClick={() => setAvailability("HAS_PRODUCT")}
            className={`px-3 py-1.5 rounded border text-sm ${availability === "HAS_PRODUCT" ? "bg-green-600 text-white border-green-600" : "border-gray-300 hover:bg-gray-50"}`}
          >
            Has
          </button>
          <button
            onClick={() => setAvailability("NO_PRODUCT")}
            className={`px-3 py-1.5 rounded border text-sm ${availability === "NO_PRODUCT" ? "bg-red-600 text-white border-red-600" : "border-gray-300 hover:bg-gray-50"}`}
          >
            Missing
          </button>
        </div>

        <div className="relative w-full lg:w-72">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by query or path…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Query</th>
              <th className="p-2 border">Availability</th>
              <th className="p-2 border">Matches</th>
              <th className="p-2 border">Path</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <LoadingRow colSpan={8} />}
            {!loading && error && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && pageItems.length === 0 && (
              <EmptyRow colSpan={8} msg="No searches found." />
            )}
            {!loading &&
              !error &&
              pageItems.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="p-2 border"><TypeBadge type={it.type} /></td>
                  <td className="p-2 border">
                    <div className="max-w-xs truncate" title={it.query || "-"}>{it.query || "-"}</div>
                    {it.ua ? (
                      <div className="text-[11px] text-gray-500 truncate" title={it.ua}>
                        {it.ua}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-2 border"><AvailabilityBadge tag={it.availabilityTag} /></td>
                  <td className="p-2 border">{it.count ?? "-"}</td>
                  <td className="p-2 border">
                    <span className="text-xs text-gray-700">{it.pathname || "-"}</span>
                  </td>
                  <td className="p-2 border">
                    {it.user ? (
                      <span className="text-xs">{typeof it.user === "object" ? it.user._id : it.user}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Guest</span>
                    )}
                  </td>
                  <td className="p-2 border"><span className="text-xs">{formatDate(it.createdAt)}</span></td>
                  <td className="p-2 border whitespace-nowrap">
                    {it.availabilityTag === "NO_PRODUCT" ? (
                      <button
                        className="text-blue-600 hover:underline mr-3"
                        onClick={() => alert(`Consider adding: "${it.query}"`)}
                      >
                        Create product
                      </button>
                    ) : null}
                    <button
                      className="text-gray-600 hover:underline"
                      onClick={() => alert(JSON.stringify(it, null, 2))}
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
          {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded border text-sm ${
              pageSafe <= 1 ? "text-gray-400 border-gray-200 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            Prev
          </button>
          <div className="text-sm">Page {pageSafe} / {totalPages}</div>
          <button
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded border text-sm ${
              pageSafe >= totalPages ? "text-gray-400 border-gray-200 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminVoiceSearches;

