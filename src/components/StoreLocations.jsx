import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import BASE_URL from "../api/configadmin.js";
import { FiBox, FiCheckCircle, FiDatabase, FiGrid, FiArrowDownCircle, FiArrowUpCircle, FiHome, FiTruck, FiSearch, FiRefreshCw, FiEdit2, FiCheck, FiX, FiChevronDown, FiDownload, FiPlusCircle, FiRepeat, FiShoppingCart, FiAlertTriangle } from "react-icons/fi";

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

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // Modal State
  const [actionModal, setActionModal] = useState({ open: false, record: null });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tab, search, hideEmpty]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const ep = tab === "master" ? "/master-sheet" : "";
      const res = await axios.get(`${BASE_URL}/admin/store-inventory${ep}`, {
        params: { page, limit: 10, q: search, tab, hideEmpty }
      });
      setRecords(res.data.records || []);
      setTotalPages(res.data.totalPages || 1);
    } catch { 
      setRecords([]); 
      setTotalPages(1);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, page, search, hideEmpty]);

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

  const handleExport = () => {
    const params = new URLSearchParams({ q: search, tab, hideEmpty });
    window.location.href = `${BASE_URL}/admin/store-inventory/export?${params.toString()}`;
    setSnack({ msg: "Downloading Excel file...", type: "info" });
  };

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
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-bold text-sm hover:bg-white/30 transition disabled:opacity-50 flex items-center justify-center gap-2">
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

        {/* ── Tabs & Filters ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(t => {
              const m = TAB_META[t];
              const active = tab === t;
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
                    active ? `bg-gradient-to-r ${m.color} text-white shadow-lg` : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200"
                  }`}>
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Tabs Dropdown */}
          <div className="md:hidden relative w-full z-20">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-full flex items-center justify-between border-2 rounded-xl px-4 py-3.5 font-bold text-sm shadow-sm focus:outline-none ${TAB_META[tab].bg} ${TAB_META[tab].text} border-current/20`}
            >
              <div className="flex items-center gap-2">
                {TAB_META[tab].icon} {TAB_META[tab].label}
              </div>
              <FiChevronDown className={`w-5 h-5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-20 divide-y divide-gray-50">
                  {TABS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-left transition ${tab === t ? `bg-gray-50 ${TAB_META[t].text}` : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {TAB_META[t].icon} {TAB_META[t].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 self-start md:self-auto w-full md:w-auto">
            {tab !== "master" && (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm w-full sm:w-auto">
                <button onClick={() => setHideEmpty(true)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-2 ${
                    hideEmpty ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                  }`}>
                  <FiCheckCircle className="w-4 h-4" /> In-Stock Only
                </button>
                <button onClick={() => setHideEmpty(false)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-2 ${
                    !hideEmpty ? "bg-gray-100 text-gray-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                  }`}>
                  <FiDatabase className="w-4 h-4" /> Show All
                </button>
              </div>
            )}
            <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2.5 md:py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm md:text-xs whitespace-nowrap flex items-center justify-center gap-2 hover:bg-emerald-100 transition shadow-sm">
              <FiDownload className="w-4 h-4" /> Export to Excel
            </button>
          </div>
        </div>

        {/* ── Content Card ── */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Loading inventory...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mb-4 flex justify-center"><FiBox className="w-12 h-12 text-gray-300" /></div>
              <div className="text-gray-500 text-lg font-medium mb-1">No inventory records</div>
              <p className="text-gray-400 text-sm">Click "Sync Products" to pull in your existing products, or adjust your filters.</p>
            </div>
          ) : tab === "master" ? (
            <MasterView records={records} onManageStock={(r) => setActionModal({ open: true, record: r })} />
          ) : (
            <LocationView records={records}
              location={tab} editing={editing} saving={saving}
              onStartEdit={startEdit} onCancelEdit={cancelEdit} onUpdateField={updateField} onSave={saveRecord} getTotal={getTotal}
              onManageStock={(r) => setActionModal({ open: true, record: r })} />
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && records.length > 0 && (
            <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} 
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm disabled:opacity-50 font-semibold text-gray-600 hover:bg-gray-50 transition">
                Previous
              </button>
              <span className="text-sm font-medium text-gray-500">Page <b className="text-gray-700">{page}</b> of <b className="text-gray-700">{totalPages}</b></span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} 
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm disabled:opacity-50 font-semibold text-gray-600 hover:bg-gray-50 transition">
                Next
              </button>
            </div>
          )}
        </div>


      </div>

      {actionModal.open && (
        <ManageStockModal 
          record={actionModal.record} 
          onClose={() => setActionModal({ open: false, record: null })} 
          onSuccess={() => {
            setSnack({ msg: "Stock action recorded successfully!", type: "info" });
            fetchRecords();
            setActionModal({ open: false, record: null });
          }}
        />
      )}

      {snack && <Snack {...snack} onClose={() => setSnack(null)} />}
    </div>
  );
}

/* ═══════ MASTER VIEW ═══════ */
function MasterView({ records, onManageStock }) {
  return (
    <>
      <div className="w-full overflow-x-auto pb-2">
        <table className="w-full text-sm min-w-[650px] md:min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-indigo-100">
              <th className="text-left px-4 sm:px-5 py-3.5 font-semibold text-gray-700 w-64">Product</th>
              <th className="hidden sm:table-cell text-left px-4 py-3.5 font-semibold text-gray-700">Variant</th>
              {LOCATIONS.map(l => (
                <th key={l} className="text-center px-2 sm:px-3 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  <div className="flex justify-center" title={TAB_META[l].label}>
                    <span className="flex items-center gap-1.5">{TAB_META[l].icon} <span className="hidden sm:inline">{TAB_META[l].label}</span></span>
                  </div>
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
                  <td className="px-3 sm:px-5 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={r.product?.images?.[0] || ""} alt="" className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover object-top bg-gray-50 border border-gray-100 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold sm:font-medium text-gray-800 text-sm whitespace-normal line-clamp-2">{r.product?.name || "Unknown"}</span>
                        <span className={`sm:hidden mt-0.5 w-fit px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                          {r.variant === "default" ? "Standard" : r.variant}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                      {r.variant === "default" ? "Standard" : r.variant}
                    </span>
                  </td>
                  {LOCATIONS.map(l => (
                    <td key={l} className="text-center px-2 sm:px-3 py-3 font-mono text-base">
                      <span className={`font-bold ${r.locations[l] > 0 ? TAB_META[l].text : "text-gray-400"}`}>
                        {r.locations[l] || 0}
                      </span>
                    </td>
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
    </>
  );
}

/* ═══════ LOCATION VIEW ═══════ */
function LocationView({ records, location, editing, saving, onStartEdit, onCancelEdit, onUpdateField, onSave, getTotal, onManageStock }) {
  const meta = TAB_META[location];
  return (
    <>
      <div className="w-full overflow-x-auto pb-2">
        <table className="w-full text-sm min-w-[550px] md:min-w-full">
          <thead>
            <tr className={`${meta.bg} border-b`}>
              <th className="text-left px-3 sm:px-5 py-3.5 font-semibold text-gray-700 w-56 sm:w-64">Product</th>
              <th className="hidden sm:table-cell text-left px-4 py-3.5 font-semibold text-gray-700">Variant</th>
              <th className={`text-center px-2 sm:px-4 py-3.5 font-bold ${meta.text}`}>
                <span className="hidden sm:inline flex items-center justify-center gap-2">{meta.icon} {meta.label} Qty</span>
                <span className="sm:hidden">Qty</span>
              </th>
              <th className="text-right sm:text-center px-3 sm:px-4 py-3.5 font-semibold text-gray-700 w-24 sm:w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const isEdit = !!editing[r._id];
              const isSave = !!saving[r._id];
              const data = editing[r._id] || r.locations;
              return (
                <tr key={r._id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition ${i % 2 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-3 sm:px-5 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={r.product?.images?.[0] || ""} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover object-top bg-gray-50 border border-gray-100 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold sm:font-medium text-gray-800 text-sm whitespace-normal line-clamp-2 max-w-[200px] sm:max-w-[250px]">{r.product?.name}</span>
                        <span className={`sm:hidden mt-1 w-fit px-1.5 py-0.5 rounded-md text-[9px] font-medium whitespace-nowrap ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                          {r.variant === "default" ? "Standard" : r.variant}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${r.variant === "default" ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                      {r.variant === "default" ? "Standard" : r.variant}
                    </span>
                  </td>
                  <td className="text-center px-2 sm:px-4 py-3">
                    <span className={`font-mono font-bold text-base sm:text-lg ${meta.text}`}>{r.locations[location] || 0}</span>
                  </td>
                  <td className="text-right sm:text-center px-3 sm:px-4 py-3">
                    <div className="flex justify-end sm:justify-center">
                      <button onClick={() => onManageStock(r)}
                        className="h-8 px-2 sm:px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1">
                        <FiBox className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Manage</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

/* ═══════ MANAGE STOCK MODAL ═══════ */
function ManageStockModal({ record, onClose, onSuccess }) {
  const [action, setAction] = useState("add_stock");
  const [fromLoc, setFromLoc] = useState("downstairs");
  const [toLoc, setToLoc] = useState("store");
  const [qty, setQty] = useState("");
  const [channel, setChannel] = useState("shop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qty || parseInt(qty) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      productId: record.product._id,
      variantId: record.variantId,
      actionType: action,
      quantity: parseInt(qty),
    };

    if (action === "add_stock") {
      payload.toLocation = toLoc;
    } else if (action === "move") {
      payload.fromLocation = fromLoc;
      payload.toLocation = toLoc;
    } else if (action === "adjustment") {
      payload.fromLocation = fromLoc;
    } else if (action === "sale") {
      payload.fromLocation = fromLoc;
      payload.channel = channel;
    }

    try {
      await axios.post(`${BASE_URL}/admin/store-inventory/action`, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process action");
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = [
    { id: "add_stock", icon: <FiPlusCircle />, label: "Add Stock", desc: "Supplier delivery (Increases total)" },
    { id: "move", icon: <FiRepeat />, label: "Move", desc: "Transfer between rooms (Total stays same)" },
    { id: "sale", icon: <FiShoppingCart />, label: "Record Sale", desc: "Sold via Shop/Wolt (Records Revenue)" },
    { id: "adjustment", icon: <FiAlertTriangle />, label: "Damage / Loss", desc: "Lost/Damaged items (No Revenue)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <FiBox className="text-indigo-600" /> Manage Stock
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Product Info Summary */}
          <div className="mb-6 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <img src={record.product?.images?.[0]} className="w-12 h-12 rounded-lg object-cover bg-white" alt="" />
            <div>
              <p className="font-bold text-sm text-indigo-900 line-clamp-1">{record.product?.name}</p>
              <p className="text-xs font-medium text-indigo-600 mt-0.5 uppercase tracking-wide">Variant: {record.variant === 'default' ? 'Standard' : record.variant}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What are you doing?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actionTypes.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAction(a.id)}
                    className={`flex flex-col items-start p-3 border-2 rounded-xl text-left transition ${action === a.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className={`flex items-center gap-2 font-bold ${action === a.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {a.icon} {a.label}
                    </div>
                    <div className={`text-xs mt-1 ${action === a.id ? 'text-indigo-600/80' : 'text-gray-500'}`}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields based on Action */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              
              {/* Add Stock Fields */}
              {action === "add_stock" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Add to which location?</label>
                  <select value={toLoc} onChange={e => setToLoc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                    {LOCATIONS.map(l => <option key={l} value={l}>{TAB_META[l].label} (Current: {record.locations[l] || 0})</option>)}
                  </select>
                </div>
              )}

              {/* Move Fields */}
              {action === "move" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Take From</label>
                    <select value={fromLoc} onChange={e => setFromLoc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                      {LOCATIONS.map(l => <option key={l} value={l}>{TAB_META[l].label} ({record.locations[l] || 0})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Move To</label>
                    <select value={toLoc} onChange={e => setToLoc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                      {LOCATIONS.filter(l => l !== fromLoc).map(l => <option key={l} value={l}>{TAB_META[l].label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Sale Fields */}
              {action === "sale" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sold Via (Channel)</label>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer font-bold transition ${channel === 'shop' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
                        <input type="radio" name="channel" value="shop" checked={channel === 'shop'} onChange={() => setChannel('shop')} className="hidden" />
                        <FiHome /> Physical Shop
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer font-bold transition ${channel === 'wolt' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-600'}`}>
                        <input type="radio" name="channel" value="wolt" checked={channel === 'wolt'} onChange={() => setChannel('wolt')} className="hidden" />
                        <FiTruck /> Wolt
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Take Stock From</label>
                    <select value={fromLoc} onChange={e => setFromLoc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                      {LOCATIONS.map(l => <option key={l} value={l}>{TAB_META[l].label} (Current: {record.locations[l] || 0})</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Adjustment Fields */}
              {action === "adjustment" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Remove From Location</label>
                  <select value={fromLoc} onChange={e => setFromLoc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                    {LOCATIONS.map(l => <option key={l} value={l}>{TAB_META[l].label} (Current: {record.locations[l] || 0})</option>)}
                  </select>
                </div>
              )}

              {/* Universal Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                <div className="relative">
                  <input 
                    type="number" min="1" 
                    value={qty} onChange={e => setQty(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full p-3 pl-4 bg-white border border-gray-300 rounded-lg font-mono font-bold text-lg focus:ring-2 focus:ring-indigo-600 outline-none" 
                  />
                </div>
              </div>

            </div>

            {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-bold border border-red-200">{error}</div>}

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold text-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                Confirm Action
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
