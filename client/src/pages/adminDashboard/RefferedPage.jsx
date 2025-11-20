import React, { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AdminAPI } from "../../config/api.js";


const PageSizeOptions = [10, 25, 50, 100];

export default function ReferredPage() {
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "Active", "Blocked"

  // modal + selected
  const [selected, setSelected] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [candidatePageBlocked, setCandidatePageBlocked] = useState(() => {
    return localStorage.getItem("candidatePageBlocked") === "true";
  });

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    fetchReferredUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, query, statusFilter]);

  async function fetchReferredUsers() {
    try {
      setLoading(true);
      setError("");
      // Call admin api (pass pagination & filters). If your API expects no params, it should still work.
      const params = { page, limit: pageSize, q: query, status: statusFilter };
      const resp = await AdminAPI.getRefferedUsers(params);

      // normalize result: support multiple response shapes
      // possible resp shapes: resp.data = { data: [...], total }, resp = { data: [...], total }, or resp.data = [...]
      let rows = [];
      let tot = 0;
      if (!resp) { rows = []; tot = 0; }
      else if (Array.isArray(resp.data)) {
        rows = resp.data;
        tot = resp.total ?? rows.length;
      } else if (resp.data && Array.isArray(resp.data.data)) {
        rows = resp.data.data;
        tot = resp.data.total ?? rows.length;
      } else if (Array.isArray(resp)) {
        rows = resp;
        tot = resp.length;
      } else if (resp.data && Array.isArray(resp.data.rows)) {
        rows = resp.data.rows;
        tot = resp.data.total ?? resp.data.rows.length;
      } else {
        // best-effort fallback
        rows = resp.data ?? [];
        tot = resp.total ?? rows.length;
      }

      if (!mountedRef.current) return;
      setReferredUsers(rows);
      setTotal(Number(tot) || rows.length);
    } catch (err) {
      console.error("Failed to fetch referred users", err);
      setError("Failed to load data. Please try again.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const handleBlockUnblockClick = (user) => {
    setSelected(user);
    setReason("");
    setShowConfirm(true);
  };

  // flexible API caller for status change - supports multiple AdminAPI shapes
  const callUpdateStatusAPI = async (id, payload) => {
    // try common method names/fallbacks
    if (typeof AdminAPI.updateReferralStatus === "function") {
      return AdminAPI.updateReferralStatus(id, payload);
    }
    // fallback: AdminAPI.patch(`/admin/${id}/status`, payload)
    if (typeof AdminAPI.patch === "function") {
      return AdminAPI.patch(`/admin/${id}/status`, payload);
    }
    // fallback: AdminAPI.api.patch(...)
    if (AdminAPI.api && typeof AdminAPI.api.patch === "function") {
      return AdminAPI.api.patch(`/admin/${id}/status`, payload);
    }
    // last fallback: try AdminAPI with endpoint helper if exists
    if (typeof AdminAPI.update === "function") {
      return AdminAPI.update(`/admin/${id}/status`, payload);
    }
    throw new Error("No compatible AdminAPI method found for updating status. Add updateReferralStatus or patch method.");
  };

  const performStatusChange = async () => {
    if (!selected) return;
    const nextStatus = selected.status === "Active" ? "Blocked" : "Active";

    try {
      setActionLoading(true);
      const payload = { status: nextStatus };
      if (nextStatus === "Blocked") payload.reason = reason || "";

      await callUpdateStatusAPI(selected._id, payload);

      // refresh
      await fetchReferredUsers();
      setShowConfirm(false);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Action failed. Check console and try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Exports (client-side for current view)
  const downloadExcel = () => {
    if (!referredUsers.length) return alert("No data to export");
    const sheetData = referredUsers.map((r) => ({
      "Roll / Unique ID": r.rollNumber || r.referrerId?.student_ID || "-",
      "Name": r.referredName || r.referrerId?.fullName || "-",
      "Email": r.referredEmail || r.referrerId?.mail_ID || "-",
      "Phone": r.referredPhone || r.referrerId?.phoneNo || "-",
      "College": r.collegeName || "-",
      "Year": r.year || "-",
      "Referral Code": r.refCode,
      "Status": r.status,
      "Referred On": new Date(r.referredDate || r.createdAt || Date.now()).toLocaleString(),
      "Query Count": r.queryCount ?? 0,
      "Tags / Notes": (r.tags || []).join("; ")
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referred");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `referred_export_page${page}.xlsx`);
  };

  const downloadCSV = () => {
    if (!referredUsers.length) return alert("No data to export");
    const ws = XLSX.utils.json_to_sheet(referredUsers.map(r => ({
      rollNumber: r.rollNumber || r.referrerId?.student_ID || "-",
      name: r.referredName || r.referrerId?.fullName || "-",
      email: r.referredEmail || r.referrerId?.mail_ID || "-",
      phone: r.referredPhone || r.referrerId?.phoneNo || "-",
      status: r.status,
      refCode: r.refCode,
    })));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `referred_export_page${page}.csv`);
  };

  const downloadJSON = () => {
    if (!referredUsers.length) return alert("No data to export");
    const blob = new Blob([JSON.stringify(referredUsers, null, 2)], { type: "application/json" });
    saveAs(blob, `referred_export_page${page}.json`);
  };

  const lastPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const toggleCandidatePageStatus = () => {
    const newStatus = !candidatePageBlocked;
    setCandidatePageBlocked(newStatus);
    localStorage.setItem("candidatePageBlocked", newStatus);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Referral Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage referred students — block/unblock, view details, export data.</p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={toggleCandidatePageStatus}
            className={`px-4 py-2 rounded text-white ${candidatePageBlocked ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {candidatePageBlocked ? 'Activate Candidate Page' : 'Block Candidate Page'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Roll / ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">College</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Referred On</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={9} className="p-6 text-center text-red-600">{error}</td></tr>
            ) : referredUsers.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">No referral records found</td></tr>
            ) : (
              referredUsers.map((r, idx) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">{r.rollNumber || r.referrerId?.student_ID || "-"}</td>
                  <td className="px-4 py-3">{r.referredName || r.referrerId?.fullName || "-"}</td>
                  <td className="px-4 py-3">{r.referredEmail || r.referrerId?.mail_ID || "-"}</td>
                  <td className="px-4 py-3">{r.referredPhone || r.referrerId?.phoneNo || "-"}</td>
                  <td className="px-4 py-3">{r.collegeName || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${r.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(r.referredDate || r.createdAt || r.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBlockUnblockClick(r)}
                        className={`px-3 py-1 rounded border text-sm ${r.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                      >
                        {r.status === 'Active' ? 'Block' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/register?ref=${r.refCode}`;
                          navigator.clipboard.writeText(url);
                          alert("Referral link copied to clipboard");
                        }}
                        className="px-3 py-1 rounded border text-sm"
                      >
                        Copy Link
                      </button>

                      <button
                        onClick={() => alert('Open details modal - implement as needed')}
                        className="px-3 py-1 rounded border text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded-md">
              {PageSizeOptions.map(s => <option key={s} value={s}>{s} / page</option>)}
            </select>

            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded-md">Prev</button>
            <div className="px-3 py-1 border rounded-md">Page {page} / {lastPage}</div>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} className="px-3 py-1 border rounded-md">Next</button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">{selected.status === 'Active' ? 'Block' : 'Activate'} Referral</h3>
            <p className="text-sm text-gray-600 mb-4">You are about to {selected.status === 'Active' ? 'block' : 'activate'} referral for <strong>{selected.referredName || selected.referrerId?.fullName || 'this user'}</strong>. This will {selected.status === 'Active' ? 'prevent' : 'allow'} them from sending referrals and the UI share options will be hidden/visible accordingly.</p>

            {selected.status === 'Active' && (
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded p-2" placeholder="Optional reason for blocking" />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setShowConfirm(false); setSelected(null); }} className="px-4 py-2 rounded border">Cancel</button>
              <button disabled={actionLoading} onClick={performStatusChange} className="px-4 py-2 rounded bg-red-600 text-white">{actionLoading ? 'Processing...' : (selected.status === 'Active' ? 'Block' : 'Activate')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
