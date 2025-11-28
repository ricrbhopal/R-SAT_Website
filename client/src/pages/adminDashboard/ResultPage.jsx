import React, { useEffect, useState, useRef } from "react";
import { AdminAPI } from "../../config/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// NOTE: Install dependencies before using this component:
// npm install xlsx file-saver react-toastify

// ----------------- Confirm Modal (Promise-based) -----------------
function ConfirmModal({ open, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-blur-backdrop">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------- Main Component -----------------
export default function ResultPage() {
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef();

  // confirm modal state — to implement confirm() as a Promise
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolver: null,
  });

  // Promise-based confirm helper
  const confirm = (message) =>
    new Promise((resolve) => {
      setConfirmState({ open: true, message, resolver: resolve });
    });

  // Cancel or confirm handlers for modal
  const handleCancelConfirm = () => {
    if (confirmState.resolver) confirmState.resolver(false);
    setConfirmState({ open: false, message: "", resolver: null });
  };
  const handleOkConfirm = () => {
    if (confirmState.resolver) confirmState.resolver(true);
    setConfirmState({ open: false, message: "", resolver: null });
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- FETCH STUDENTS ----------
  const fetchStudents = async () => {
    setLoading(true);
    try {
      let resp;
      if (AdminAPI.getAllStudents) {
        resp = await AdminAPI.getAllStudents();
      } else if (AdminAPI.getAllResultsWithStudentDetails) {
        const r = await AdminAPI.getAllResultsWithStudentDetails();
        const data = r.data || r;
        const map = new Map();
        data.forEach((item) => {
          if (item.student_ID) {
            const sid =
              typeof item.student_ID === "object"
                ? item.student_ID._id ||
                  item.student_ID.student_ID ||
                  JSON.stringify(item.student_ID)
                : item.student_ID;
            map.set(sid, item.student_ID);
          }
        });
        const arr = Array.from(map.values());
        resp = { data: arr };
      } else {
        try {
          resp = await AdminAPI.api.get("/students");
        } catch (e) {
          resp = { data: [] };
        }
      }

      const list = resp.data || [];
      setStudents(list);

      const getCustomStudentId = (s) => {
        if (typeof s.student_ID === "object" && s.student_ID.student_ID)
          return s.student_ID.student_ID;
        if (s.student_ID) return s.student_ID;
        if (s.studentId) return s.studentId;
        if (s.id) return s.id;
        if (s._id) return s._id;
        return "";
      };

      const initialRows = list.map((s) => ({
        _id: s._id || null,
        student_ID: getCustomStudentId(s),
        fullName:
          s.fullName ||
          s.name ||
          s.fullname ||
          (s.student_ID && s.student_ID.fullName) ||
          "",
        A: "",
        B: "",
        C: "",
        D: "",
        total: "",
        percentage: "",
        scholarShip: "",
        status: "idle",
      }));
      setRows(initialRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch students: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // ---------- EXPORT TEMPLATE ----------
  const exportTemplate = async () => {
    const ok = await confirm("Export template Excel? You will download an Excel template with student IDs.");
    if (!ok) return;
    const wb = XLSX.utils.book_new();
    const data = rows.map((r) => ({
      "Student ID": r.student_ID,
      "Full Name": r.fullName,
      A: r.A,
      B: r.B,
      C: r.C,
      D: r.D,
    }));
    const ws = XLSX.utils.json_to_sheet(data, {
      header: ["Student ID", "Full Name", "A", "B", "C", "D"],
    });
    XLSX.utils.book_append_sheet(wb, ws, "template");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "results-template.xlsx");
    toast.success("Template downloaded. Fill marks for A,B,C,D and import back.");
  };

  // ---------- HELPERS ----------
  const getObjectIdFromCustomId = (customId) => {
    const student = students.find((s) => {
      if (typeof s.student_ID === "object" && s.student_ID.student_ID)
        return s.student_ID.student_ID === customId;
      if (s.student_ID) return String(s.student_ID) === String(customId);
      if (s.studentId) return String(s.studentId) === String(customId);
      if (s.id) return String(s.id) === String(customId);
      if (s._id) return String(s._id) === String(customId);
      return false;
    });
    return student?._id || customId;
  };

  // ---------- IMPORT FILE ----------
  const handleFile = async (file) => {
    if (!file) return;
    const ok = await confirm("Import selected Excel and create results in database? Proceed?");
    if (!ok) {
      if (inputRef.current) inputRef.current.value = null;
      return;
    }

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const toCreate = [];

      json.forEach((r) => {
        const customId = r["Student ID"] || r["student_ID"] || r["studentId"] || r["StudentID"];
        if (!customId) return;
        const objectId = getObjectIdFromCustomId(customId);
        const A = Number(r["A"] || 0);
        const B = Number(r["B"] || 0);
        const C = Number(r["C"] || 0);
        const D = Number(r["D"] || 0);

        if ([A, B, C, D].some((v) => isNaN(v) || v < 0 || v > 100)) {
          return;
        }
        toCreate.push({ student_ID: objectId, A, B, C, D });
      });

      if (toCreate.length === 0) {
        toast.info("No valid rows found to import.");
        setLoading(false);
        return;
      }

      const promises = toCreate.map((payload) =>
        AdminAPI.createResult(payload)
          .then((res) => ({ ok: true, res, payload }))
          .catch((err) => ({ ok: false, err, payload }))
      );

      const results = await Promise.all(promises);
      const newRows = [...rows];

      results.forEach((r) => {
        if (r.ok) {
          const created = r.res.data?.result || r.res.data || r.res;
          const mongoId = created._id || created.id || null;
          const sid =
            (created.student_ID &&
              (created.student_ID.student_ID || created.student_ID._id || created.student_ID)) ||
            created.student_ID ||
            created.studentId ||
            r.payload.student_ID;
          const idx = newRows.findIndex(
            (row) => String(row.student_ID) === String(sid) || String(getObjectIdFromCustomId(row.student_ID)) === String(sid)
          );
          const total = created.total ?? (created.A + created.B + created.C + created.D) ?? (r.payload.A + r.payload.B + r.payload.C + r.payload.D);
          const percentage = created.percentage ?? (total / 400) * 100;
          let scholarShipCategory = "No Scholarship";
          if (percentage >= 95) scholarShipCategory = "100% Scholarship";
          else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
          else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
          else if (percentage >= 60) scholarShipCategory = "10% Scholarship";

          const updated = {
            ...(idx !== -1 ? newRows[idx] : { student_ID: sid, fullName: created.studentName || "" }),
            _id: mongoId,
            A: created.A ?? r.payload.A,
            B: created.B ?? r.payload.B,
            C: created.C ?? r.payload.C,
            D: created.D ?? r.payload.D,
            total,
            percentage: Number(percentage).toFixed(2),
            scholarShip: scholarShipCategory,
            status: "created",
          };
          if (idx !== -1) newRows[idx] = updated;
          else newRows.push(updated);
        } else {
          console.error("Import error for payload:", r.payload, r.err || r);
        }
      });

      setRows(newRows);
      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast.warn(`${failed.length} rows failed to import.`);
      else toast.success("All rows imported and results created.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to read import file: " + (error.message || error));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = null;
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // ---------- CREATE SINGLE ----------
  const createSingle = async (rowIndex) => {
    const ok = await confirm("Create result for this student? This will save the row to database.");
    if (!ok) return;

    const r = rows[rowIndex];
    const payload = { student_ID: r.student_ID, A: Number(r.A) || 0, B: Number(r.B) || 0, C: Number(r.C) || 0, D: Number(r.D) || 0 };
    try {
      setLoading(true);
      const res = await AdminAPI.createResult(payload);
      const created = res.data?.result || res.data || res;
      const mongoId = created._id || created.id || null;
      const total = created.total ?? (payload.A + payload.B + payload.C + payload.D);
      const percentage = created.percentage ?? (total / 400) * 100;
      let scholarShipCategory = "No Scholarship";
      if (percentage >= 95) scholarShipCategory = "100% Scholarship";
      else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
      else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
      else if (percentage >= 60) scholarShipCategory = "10% Scholarship";

      const newRows = [...rows];
      newRows[rowIndex] = { ...newRows[rowIndex], _id: mongoId, ...payload, total, percentage: Number(percentage).toFixed(2), scholarShip: scholarShipCategory, status: "created" };
      setRows(newRows);
      toast.success("Result created for " + newRows[rowIndex].fullName);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create result: " + (error.message || error));
      const newRows = [...rows];
      newRows[rowIndex] = { ...newRows[rowIndex], status: "error" };
      setRows(newRows);
    } finally {
      setLoading(false);
    }
  };

  // ---------- SAVE ALL (bulk) ----------
  const saveAll = async () => {
    const ok = await confirm("Save all rows to DB? This will create results for every row with valid marks.");
    if (!ok) return;

    const prepared = rows.map((r) => ({
      student_ID: r.student_ID,
      A: r.A === "" ? null : Number(r.A),
      B: r.B === "" ? null : Number(r.B),
      C: r.C === "" ? null : Number(r.C),
      D: r.D === "" ? null : Number(r.D),
    }));

    const invalid = prepared.filter((p) => p.student_ID == null || [p.A, p.B, p.C, p.D].some((v) => v === null || isNaN(v) || v < 0 || v > 100));
    if (invalid.length) {
      const newRows = rows.map((r) => {
        const p = prepared.find((x) => String(x.student_ID) === String(r.student_ID));
        if (!p || [p.A, p.B, p.C, p.D].some((v) => v === null || isNaN(v) || v < 0 || v > 100)) return { ...r, status: "error" };
        return r;
      });
      setRows(newRows);
      toast.error(`There are ${invalid.length} invalid rows. Fill all A-D (0-100) before saving.`);
      return;
    }

    setLoading(true);
    setRows((prev) => prev.map((r) => ({ ...r, status: "saving" })));

    const ops = prepared.map((payload) =>
      AdminAPI.createResult(payload)
        .then((res) => ({ ok: true, res, payload }))
        .catch((err) => ({ ok: false, err, payload }))
    );

    const results = await Promise.all(ops);
    const newRows = [...rows];

    results.forEach((r) => {
      const sid = r.payload.student_ID;
      const idx = newRows.findIndex((row) => String(row.student_ID) === String(sid));
      if (r.ok) {
        const created = r.res.data?.result || r.res.data || r.res;
        const mongoId = created._id || created.id || null;
        const total = created.total ?? (created.A + created.B + created.C + created.D) ?? (r.payload.A + r.payload.B + r.payload.C + r.payload.D);
        const percentage = created.percentage ?? (total / 400) * 100;
        let scholarShipCategory = "No Scholarship";
        if (percentage >= 95) scholarShipCategory = "100% Scholarship";
        else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
        else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
        else if (percentage >= 60) scholarShipCategory = "10% Scholarship";

        const updated = {
          ...(idx !== -1 ? newRows[idx] : { student_ID: sid, fullName: created.studentName || "" }),
          _id: mongoId,
          A: created.A ?? r.payload.A,
          B: created.B ?? r.payload.B,
          C: created.C ?? r.payload.C,
          D: created.D ?? r.payload.D,
          total,
          percentage: Number(percentage).toFixed(2),
          scholarShip: scholarShipCategory,
          status: "created",
        };
        if (idx !== -1) newRows[idx] = updated;
        else newRows.push(updated);
      } else {
        if (idx !== -1) newRows[idx] = { ...newRows[idx], status: "error" };
        console.error("Save error for:", r.payload, r.err || r);
      }
    });

    setRows(newRows);
    const failed = results.filter((r) => !r.ok);
    if (failed.length) toast.warn(`${failed.length} rows failed to save.`);
    else toast.success("All rows saved successfully.");
    setLoading(false);
  };

  // ---------- UPDATE CELL (local preview) ----------
  const updateCell = (index, key, value) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], [key]: value };

    const A = Number(copy[index].A) || 0;
    const B = Number(copy[index].B) || 0;
    const C = Number(copy[index].C) || 0;
    const D = Number(copy[index].D) || 0;

    if ([copy[index].A, copy[index].B, copy[index].C, copy[index].D].every((v) => v !== "")) {
      const total = A + B + C + D;
      const percentage = (total / 400) * 100;
      copy[index].total = total;
      copy[index].percentage = Number(percentage).toFixed(2);

      let scholarShipCategory = "No Scholarship";
      if (percentage >= 95) scholarShipCategory = "100% Scholarship";
      else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
      else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
      else if (percentage >= 60) scholarShipCategory = "10% Scholarship";
      copy[index].scholarShip = scholarShipCategory;
    } else {
      copy[index].total = "";
      copy[index].percentage = "";
      copy[index].scholarShip = "";
    }
    setRows(copy);
  };

  // ---------- FETCH ALL RESULTS FROM DB ----------
  const fetchAllResults = async () => {
    setLoading(true);
    try {
      const allResultsResp = await AdminAPI.getAllResultsWithStudentDetails();
        const allResults = allResultsResp.data || [];
      const mappedRows = allResults.map((result) => {
        const percent = result.percentage ?? ((result.total ?? result.A + result.B + result.C + result.D) / 400) * 100;
        return {
          _id: result._id,
          student_ID: typeof result.student_ID === "object" ? result.student_ID.student_ID || result.student_ID._id || JSON.stringify(result.student_ID) : result.student_ID,
          fullName: result.fullName || (result.student_ID && result.student_ID.fullName) || "",
          A: result.A,
          B: result.B,
          C: result.C,
          D: result.D,
          total: result.total,
          percentage: Number(percent).toFixed(2),
          scholarShip: percent >= 95 ? "100% Scholarship" : percent >= 85 ? "50% Scholarship" : percent >= 75 ? "25% Scholarship" : percent >= 60 ? "10% Scholarship" : "No Scholarship",
          status: "created",
        };
      });
      setRows(mappedRows);
      toast.success("All results loaded from DB.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch all results from DB.");
    }
    setLoading(false);
  };

  // ---------- DELETE ALL ----------
  const deleteAllResults = async () => {
    const ok = await confirm("Delete ALL results from DB? This cannot be undone.");
    if (!ok) return;
    setLoading(true);
    try {
      const allResultsResp = await AdminAPI.getAllResultsWithStudentDetails();
      const allResults = allResultsResp.data || [];
      const deletePromises = allResults.map((result) =>
        AdminAPI.deleteResult(result._id)
          .then(() => ({ ok: true }))
          .catch((err) => ({ ok: false, err }))
      );
      const results = await Promise.all(deletePromises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast.error(`${failed.length} results failed to delete.`);
      else toast.success("All results deleted successfully.");
      setRows([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete all results.");
    }
    setLoading(false);
  };

  // ---------- DELETE SINGLE (robust) ----------
  const deleteResultById = async (rowOrId) => {
    const ok = await confirm("Delete this result from DB? This action cannot be undone.");
    if (!ok) return;
    setLoading(true);
    try {
      let id = typeof rowOrId === "object" ? rowOrId._id || rowOrId.student_ID : rowOrId;
      const looksLikeObjectId = String(id).length === 24 && /^[0-9a-fA-F]+$/.test(String(id));
      let mongoId = looksLikeObjectId ? id : null;

      if (!mongoId) {
        const res = await AdminAPI.getAllResultsWithStudentDetails();
        const all = res.data || [];
        const found = all.find((r) => String(r.student_ID) === String(id) || (r.student_ID && r.student_ID.student_ID === id));
        mongoId = found?._id;
        if (!mongoId) throw new Error("Result document id not found for this student");
      }

      await AdminAPI.deleteResult(mongoId);
      setRows((prev) => prev.filter((row) => row._id !== mongoId && String(getObjectIdFromCustomId(row.student_ID)) !== String(mongoId)));
      toast.success("Result deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete result. Check console/network tab.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- FILTER & STATUS BADGE ----------
  const filteredRows = rows.filter(
    (row) =>
      String(row.student_ID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(row.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      idle: { color: "gray", text: "Pending" },
      created: { color: "green", text: "Saved" },
      error: { color: "red", text: "Error" },
      saving: { color: "yellow", text: "Saving" },
    };
    const config = statusConfig[status] || statusConfig.idle;
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{config.text}</span>;
  };

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <ConfirmModal open={confirmState.open} message={confirmState.message} onCancel={handleCancelConfirm} onConfirm={handleOkConfirm} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Result Management</h1>
              <p className="text-gray-600 mt-2">Manage student results and scholarship calculations</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>


        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row md:justify-between gap-4">
          <div className="flex gap-2">
            <button onClick={exportTemplate} disabled={loading || rows.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Export Template</button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer">
              Import Excel
              <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onFileChange} className="hidden" />
            </label>
            <button onClick={saveAll} disabled={loading || rows.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save All to DB</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirm("Refresh students from server?").then(ok => ok && fetchStudents())} className="px-4 py-2 bg-gray-600 text-white rounded-lg">Refresh</button>
            <button onClick={fetchAllResults} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Fetch Results</button>
            <button onClick={deleteAllResults} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete All Results</button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student RSAT ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((row, index) => (
                  <tr key={String(row.student_ID) + "-" + index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {typeof row.student_ID === "object" ? row.student_ID.student_ID || row.student_ID._id || JSON.stringify(row.student_ID) : String(row.student_ID)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {typeof row.fullName === "object" ? row.fullName.fullName || row.fullName.name || JSON.stringify(row.fullName) : String(row.fullName)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["A", "B", "C", "D"].map((subject) => (
                          <div key={subject} className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Subject {subject}</label>
                            <input type="number" min="0" max="100" value={row[subject]} onChange={(e) => updateCell(index, subject, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0-100" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><span className="text-sm text-gray-500">Total:</span><span className="text-sm font-semibold">{row.total || "-"}</span></div>
                        <div className="flex items-center gap-2"><span className="text-sm text-gray-500">Percentage:</span><span className="text-sm font-semibold">{row.percentage || "-"}%</span></div>
                        <div className="flex items-center gap-2"><span className="text-sm text-gray-500">Scholarship:</span><span className="text-sm font-semibold">{row.scholarShip || "-"}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(row.status)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">{searchTerm ? "Try adjusting your search terms" : "Get started by importing student data"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/40  drop-shadow-blue-50 bg-blue-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-lg font-medium text-gray-900">Processing...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
