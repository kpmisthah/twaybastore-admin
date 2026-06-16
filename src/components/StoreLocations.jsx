import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";
import { FiBox, FiCheckCircle, FiDatabase, FiGrid, FiArrowDownCircle, FiArrowUpCircle, FiHome, FiTruck, FiSearch, FiRefreshCw, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const LOCATIONS = ["downstairs", "upstairs", "store", "garage"];
const TABS = ["master", ...LOCATIONS];
const TAB_META = {
  master:     { label: "Master Sheet", icon: <FiGrid className="w-4 h-4" />, color: "from-violet-600 to-indigo-600", bg: "bg-violet-50",  text: "text-violet-700" },
  downstairs: { label: "Downstairs",   icon: <FiArrowDownCircle className="w-4 h-4" />, color: "from-blue-600 to-cyan-600",     bg: "bg-blue-50",    text: "text-blue-700" },
  upstairs:   { label: "Upstairs",     icon: <FiArrowUpCircle className="w-4 h-4" />, color: "from-emerald-600 to-teal-600",  bg: "bg-emerald-50", text: "text-emerald-700" },
  store:      { label: "Store",        icon: <FiHome className="w-4 h-4" />, color: "from-amber-500 to-orange-500",  bg: "bg-amber-50",   text: "text-amber-700" },
  garage:     { label: "Garage",       icon: <FiTruck className="w-4 h-4" />, color: "from-rose-500 to-pink-500",     bg: "bg-rose-50",    text: "text-rose-700" },
};

export default function StoreLocations() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("master");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [snack, setSnack] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const ep = tab === "master" ? "/master-sheet" : "";
      const res = await axios.get(`${BASE_URL}/admin/store-inventory${ep}`);
      setRecords(res.data.records || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [tab]);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r => r.product?.name?.toLowerCase().includes(q) || r.variant?.toLowerCase().includes(q));
  }, [records, search]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(`${BASE_URL}/admin/store-inventory/bulk-init`);
      setSnack({ msg: `✅ ${res.data.message}`, type: "info" });
      fetchRecords();
    } catch { setSnack({ msg: "Sync failed", type: "error" }); }
    finally { setSyncing(false); }
  };

  const startEdit = (id, locs) => setEditing(p => ({ ...p, [id]: { ...locs } }));
  const cancelEdit = (id) => setEditing(p => { const n = { ...p }; delete n[id]; return n; });
  const updateField = (id, field, val) => {
    setEditing(p => ({ ...p, [id]: { ...p[id], [field]: Math.max(0, parseInt(val) || 0) } }));
  };
  const saveRecord = async (id) => {
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await axios.put(`${BASE_URL}/admin/store-inventory/${id}`, { locations: editing[id] });
      setSnack({ msg: "✅ Saved!", type: "info" });
      cancelEdit(id);
      fetchRecords();
    } catch (e) { setSnack({ msg: e?.response?.data?.message || "Save failed", type: "error" }); }
    finally { setSaving(p => ({ ...p, [id]: false })); }
  };

  const getTotal = (loc) => LOCATIONS.reduce((s, k) => s + (loc[k] || 0), 0);
  const meta = TAB_META[tab];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-4 px-3 md:py-8 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header Card ── */}
        <div className={`bg-gradient-to-r ${meta.color} rounded-2xl p-5 md:p-8 mb-6 shadow-xl text-white`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <FiBox className="w-8 h-8" /> Store Locations
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Track inventory across Downstairs · Upstairs · Store · Garage
              </p>
            </div>
            <button onClick={handleSync} disabled={syncing}
              className="px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
              <FiRefreshCw className={syncing ? "animate-spin w-4 h-4" : "w-4 h-4"} />
              {syncing ? "Syncing..." : "Sync Products"}
            </button>
          </div>

          {/* ── Search inside header ── */}
          <div className="mt-5">
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2"><FiSearch className="w-4 h-4 text-white/50" /></span>
              <input type="text" placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => {
            const m = TAB_META[t];
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  active ? `bg-gradient-to-r ${m.color} text-white shadow-lg scale-105` : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200"
                }`}>
                <span>{m.icon}</span>
                <span className="hidden sm:inline">{m.label}</span>
                <span className="sm:hidden">{m.label.slice(0, 5)}</span>
              </button>
            );
          })}
          {tab !== "master" && (
            <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-shrink-0">
              <button onClick={() => setHideEmpty(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  hideEmpty ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                }`}>
                <FiCheckCircle className="w-3.5 h-3.5" /> In-Stock Only
              </button>
              <button onClick={() => setHideEmpty(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  !hideEmpty ? "bg-gray-100 text-gray-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                }`}>
                <FiDatabase className="w-3.5 h-3.5" /> Show All Products
              </button>
            </div>
          )}
        </div>

        {/* ── Content Card ── */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Loading inventory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mb-4 flex justify-center"><FiBox className="w-12 h-12 text-gray-300" /></div>
              <div className="text-gray-500 text-lg font-medium mb-1">No inventory records</div>
              <p className="text-gray-400 text-sm">Click "Sync Products" to pull in your existing products.</p>
            </div>
          ) : tab === "master" ? (
            <MasterView records={filtered} />
          ) : (
            <LocationView records={hideEmpty ? filtered.filter(r => (r.locations?.[tab] || 0) > 0 || editing[r._id]) : filtered}
              location={tab} editing={editing} saving={saving}
              onStartEdit={startEdit} onCancelEdit={cancelEdit} onUpdateField={updateField} onSave={saveRecord} getTotal={getTotal} />
          )}
        </div>


      </div>

      {snack && <Snack {...snack} onClose={() => setSnack(null)} />}
    </div>
  );
}

/* ═══════ MASTER VIEW ═══════ */
function MasterView({ records }) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-indigo-100">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-700">Product</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Variant</th>
              {LOCATIONS.map(l => (
                <th key={l} className="text-center px-3 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  {TAB_META[l].icon} {TAB_META[l].label}
                </th>
              ))}
              <th className="text-center px-4 py-3.5 font-bold text-indigo-700 text-xs uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const total = r.total ?? LOCATIONS.reduce((s, l) => s + (r.locations[l] || 0), 0);
              return (
                <tr key={r._id} className={`border-b border-gray-50 hover:bg-indigo-50/40 transition ${i % 2 ? "bg-gray-50/50" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.product?.images?.[0] || ""} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0" />
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">{r.product?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                      {r.variant === "default" ? "Standard" : r.variant}
                    </span>
                  </td>
                  {LOCATIONS.map(l => (
                    <td key={l} className="text-center px-3 py-3 font-mono text-gray-700">{r.locations[l] || 0}</td>
                  ))}
                  <td className="text-center px-4 py-3">
                    <span className={`font-bold px-2.5 py-1 rounded-lg text-sm ${total > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{total}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {records.map(r => {
          const total = r.total ?? LOCATIONS.reduce((s, l) => s + (r.locations[l] || 0), 0);
          return (
            <div key={r._id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={r.product?.images?.[0] || ""} alt="" className="w-11 h-11 rounded-xl object-contain bg-gray-50 border" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 text-sm truncate">{r.product?.name}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-600"}`}>
                    {r.variant === "default" ? "Standard" : r.variant}
                  </span>
                </div>
                <span className={`font-bold text-lg px-3 py-1 rounded-xl ${total > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{total}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {LOCATIONS.map(l => (
                  <div key={l} className={`${TAB_META[l].bg} rounded-lg p-2 text-center`}>
                    <div className="text-[10px] text-gray-500">{TAB_META[l].icon}</div>
                    <div className={`font-bold text-sm ${TAB_META[l].text}`}>{r.locations[l] || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ═══════ LOCATION VIEW ═══════ */
function LocationView({ records, location, editing, saving, onStartEdit, onCancelEdit, onUpdateField, onSave, getTotal }) {
  const meta = TAB_META[location];
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${meta.bg} border-b`}>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-700">Product</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Variant</th>
              <th className={`text-center px-4 py-3.5 font-bold ${meta.text} flex items-center justify-center gap-2`}>{meta.icon} {meta.label} Qty</th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-700 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const isEdit = !!editing[r._id];
              const isSave = !!saving[r._id];
              const data = editing[r._id] || r.locations;
              const total = getTotal(isEdit ? data : r.locations);
              return (
                <tr key={r._id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition ${i % 2 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.product?.images?.[0] || ""} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0" />
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">{r.product?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                      {r.variant === "default" ? "Standard" : r.variant}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    {isEdit ? (
                      <input type="number" min="0" value={data[location] ?? 0}
                        onChange={e => onUpdateField(r._id, location, e.target.value)}
                        disabled={isSave}
                        className={`w-20 text-center px-2 py-1.5 border-2 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 ${meta.text} border-current focus:ring-current/20`} />
                    ) : (
                      <span className={`font-mono font-bold text-lg ${meta.text}`}>{r.locations[location] || 0}</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    {isEdit ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => onSave(r._id)} disabled={isSave}
                          className="h-8 px-3 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm">
                          {isSave ? <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> : <><FiCheck className="w-4 h-4" /> Save</>}
                        </button>
                        <button onClick={() => onCancelEdit(r._id)} disabled={isSave}
                          className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition disabled:opacity-50 flex items-center justify-center shadow-sm">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => onStartEdit(r._id, { ...r.locations })}
                        className={`h-8 px-3 ${meta.bg} ${meta.text} rounded-lg text-xs font-bold hover:opacity-80 transition flex items-center justify-center gap-1.5 mx-auto shadow-sm`}>
                        <FiEdit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {records.map(r => {
          const isEdit = !!editing[r._id];
          const isSave = !!saving[r._id];
          const data = editing[r._id] || r.locations;
          const total = getTotal(isEdit ? data : r.locations);
          return (
            <div key={r._id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={r.product?.images?.[0] || ""} alt="" className="w-11 h-11 rounded-xl object-contain bg-gray-50 border" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 text-sm truncate">{r.product?.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-600"}`}>
                      {r.variant === "default" ? "Standard" : r.variant}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`${meta.bg} rounded-xl p-3 flex items-center justify-between`}>
                <span className={`text-sm font-semibold ${meta.text}`}>{meta.icon} {meta.label}</span>
                {isEdit ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="0" value={data[location] ?? 0}
                      onChange={e => onUpdateField(r._id, location, e.target.value)}
                      disabled={isSave}
                      className={`w-14 h-8 text-center px-1 border-2 rounded-md font-mono font-bold text-sm ${meta.text} border-current focus:outline-none bg-white`} />
                    <button onClick={() => onSave(r._id)} disabled={isSave}
                      className="h-8 w-8 bg-emerald-500 text-white rounded-md flex items-center justify-center shadow-sm hover:bg-emerald-600 transition disabled:opacity-50">
                      {isSave ? <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> : <FiCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onCancelEdit(r._id)} disabled={isSave}
                      className="h-8 w-8 bg-gray-200 text-gray-600 rounded-md flex items-center justify-center shadow-sm hover:bg-gray-300 transition">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xl ${meta.text}`}>{r.locations[location] || 0}</span>
                    <button onClick={() => onStartEdit(r._id, { ...r.locations })}
                      className={`h-8 w-8 bg-white/80 ${meta.text} rounded-md shadow-sm flex items-center justify-center hover:bg-white transition`}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ═══════ SNACK ═══════ */
function Snack({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:min-w-[300px] px-5 py-3 rounded-xl shadow-2xl text-white font-medium z-50 text-sm ${type === "error" ? "bg-red-600" : "bg-indigo-600"}`}>
      {msg}
    </div>
  );
}
