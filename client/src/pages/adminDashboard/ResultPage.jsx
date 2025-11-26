import React, { useEffect, useState, useRef } from "react";
import { AdminAPI } from "../../config/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// NOTE: Install dependencies before using this component:
// npm install xlsx file-saver react-toastify

export default function ResultPage() {
  const [students, setStudents] = useState([]); // { _id, fullName, email }
  const [rows, setRows] = useState([]); // table rows with scores and computed values
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    fetchStudents();
  }, []);

  // Try to fetch a list of students. If an explicit students endpoint exists (AdminAPI.getAllStudents)
  // this code will try it first; otherwise it will fallback to results-with-student-details
  const fetchStudents = async () => {
    setLoading(true);
    try {
      let resp;
      // try a likely endpoint
      if (AdminAPI.getAllStudents) {
        resp = await AdminAPI.getAllStudents();
      } else if (AdminAPI.getAllResultsWithStudentDetails) {
        // fallback: get results with student details, then extract unique students
        const r = await AdminAPI.getAllResultsWithStudentDetails();
        const data = r.data || r;
        // extract students from results
        const map = new Map();
        data.forEach((item) => {
          if (item.student_ID) map.set(item.student_ID._id || item.student_ID, item.student_ID);
        });
        const arr = Array.from(map.values());
        resp = { data: arr };
      } else {
        // last resort: try /students via raw get (if api has generic get method)
        try {
          resp = await AdminAPI.api.get('/students');
        } catch (e) {
          resp = { data: [] };
        }
      }

      const list = resp.data || [];
      setStudents(list);

      // In fetchStudents and all result mapping, prefer custom student_ID
      const getCustomStudentId = (s) => {
        if (typeof s.student_ID === 'object' && s.student_ID.student_ID) return s.student_ID.student_ID;
        if (s.student_ID) return s.student_ID;
        if (s.studentId) return s.studentId;
        if (s.id) return s.id;
        return '';
      };

      // initialise rows: student id & name populated, scores blank, computed values blank
      const initialRows = list.map((s) => ({
        student_ID: getCustomStudentId(s),
        fullName: s.fullName || s.name || s.fullname || (s.student_ID && s.student_ID.fullName) || '',
        A: "",
        B: "",
        C: "",
        D: "",
        total: "",
        percentage: "",
        scholarShip: "",
        status: "idle", // idle | created | error | saving
      }));
      setRows(initialRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch students: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Export template Excel with Student ID and Full Name columns and blank A-D
  const exportTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = rows.map((r) => ({
      "Student ID": r.student_ID,
      "Full Name": r.fullName,
      A: r.A,
      B: r.B,
      C: r.C,
      D: r.D,
    }));
    const ws = XLSX.utils.json_to_sheet(data, { header: ["Student ID", "Full Name", "A", "B", "C", "D"] });
    XLSX.utils.book_append_sheet(wb, ws, "template");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "results-template.xlsx");
    toast.success("Template downloaded. Fill marks for A,B,C,D and import back.");
  };

  // Helper: get MongoDB ObjectId from custom student_ID
  const getObjectIdFromCustomId = (customId) => {
    const student = students.find(s => {
      if (typeof s.student_ID === 'object' && s.student_ID.student_ID) return s.student_ID.student_ID === customId;
      if (s.student_ID) return s.student_ID === customId;
      if (s.studentId) return s.studentId === customId;
      if (s.id) return s.id === customId;
      return false;
    });
    return student?._id || customId;
  };

  // when user selects file to import
  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // Expect columns: Student ID, Full Name, A, B, C, D
      const toCreate = [];
      const rowMap = {};

      json.forEach((r, idx) => {
        const customId = r['Student ID'] || r['student_ID'] || r['studentId'] || r['StudentID'];
        if (!customId) return; // skip rows without id
        const objectId = getObjectIdFromCustomId(customId);
        const A = Number(r['A'] || 0);
        const B = Number(r['B'] || 0);
        const C = Number(r['C'] || 0);
        const D = Number(r['D'] || 0);
        // Basic validation: marks should be numbers between 0 and 100
        if ([A,B,C,D].some(v => isNaN(v) || v < 0)) {
          // mark as invalid in local table
          rowMap[customId] = { error: 'Invalid marks' };
          return;
        }
        toCreate.push({ student_ID: objectId, A, B, C, D });
      });

      if (toCreate.length === 0) {
        toast.info("No valid rows found to import.");
        setLoading(false);
        return;
      }

      // For each row, call createResult API. Use Promise.all but be tolerant of individual failures.
      const promises = toCreate.map((payload) =>
        AdminAPI.createResult(payload)
          .then((res) => ({ ok: true, res }))
          .catch((err) => ({ ok: false, err, payload }))
      );

      const results = await Promise.all(promises);

      // Apply results to rows view: update matching student row with returned result
      const newRows = [...rows];

      results.forEach((r) => {
        if (r.ok) {
          const created = r.res.data?.result || r.res.data || r.res; // handle response shape
          // created contains student_ID (populated?) and computed fields
          const sid = (created.student_ID && (created.student_ID.student_ID || created.student_ID._id || created.student_ID)) || created.student_ID || created.studentId;
          const idx = newRows.findIndex((row) => String(row.student_ID) === String(sid) || String(getObjectIdFromCustomId(row.student_ID)) === String(sid));
          const total = created.total ?? (created.A + created.B + created.C + created.D);
          const percentage = created.percentage ?? (total / 400) * 100;
          let scholarShipCategory = "No Scholarship";
          if (percentage >= 95) scholarShipCategory = "100% Scholarship";
          else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
          else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
          else if (percentage >= 60) scholarShipCategory = "10% Scholarship";
          const updated = {
            ...((idx !== -1) ? newRows[idx] : { student_ID: sid, fullName: created.studentName || "" }),
            A: created.A,
            B: created.B,
            C: created.C,
            D: created.D,
            total,
            percentage: Number(percentage).toFixed(2),
            scholarShip: scholarShipCategory,
            status: 'created'
          };
          if (idx !== -1) newRows[idx] = updated; else newRows.push(updated);
        } else {
          const sid = r.payload.student_ID;
          const idx = newRows.findIndex((row) => String(getObjectIdFromCustomId(row.student_ID)) === String(sid));
          if (idx !== -1) newRows[idx] = { ...newRows[idx], status: 'error' };
        }
      });

      setRows(newRows);

      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast.warn(`${failed.length} rows failed to import (check console).`);
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
    handleFile(file);
  };

  // Manual create for a single row (if user edits in table and clicks Save)
  const createSingle = async (rowIndex) => {
    const r = rows[rowIndex];
    const payload = { student_ID: r.student_ID, A: Number(r.A)||0, B: Number(r.B)||0, C: Number(r.C)||0, D: Number(r.D)||0 };
    try {
      setLoading(true);
      const res = await AdminAPI.createResult(payload);
      const created = res.data?.result || res.data || res;
      const total = created.total ?? (payload.A + payload.B + payload.C + payload.D);
      const percentage = created.percentage ?? (total / 400) * 100;
      let scholarShipCategory = "No Scholarship";
      if (percentage >= 95) scholarShipCategory = "100% Scholarship";
      else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
      else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
      else if (percentage >= 60) scholarShipCategory = "10% Scholarship";
      const newRows = [...rows];
      newRows[rowIndex] = { ...newRows[rowIndex], ...payload, total, percentage: Number(percentage).toFixed(2), scholarShip: scholarShipCategory, status: 'created' };
      setRows(newRows);
      toast.success("Result created for " + newRows[rowIndex].fullName);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create result: " + (error.message || error));
      const newRows = [...rows];
      newRows[rowIndex] = { ...newRows[rowIndex], status: 'error' };
      setRows(newRows);
    } finally {
      setLoading(false);
    }
  };

  // Save ALL rows to DB (bulk save)
  const saveAll = async () => {
    // Validate rows: require A-D to be filled (or treat empty as 0 based on your preference)
    const prepared = rows.map((r) => ({
      student_ID: r.student_ID,
      A: r.A === "" ? null : Number(r.A),
      B: r.B === "" ? null : Number(r.B),
      C: r.C === "" ? null : Number(r.C),
      D: r.D === "" ? null : Number(r.D),
    }));

    // mark rows with missing values
    const invalid = prepared.filter(p => p.student_ID == null || [p.A,p.B,p.C,p.D].some(v => v === null || isNaN(v) || v < 0));
    if (invalid.length) {
      // highlight invalid rows and notify user
      const newRows = rows.map((r) => {
        const p = prepared.find(x => String(x.student_ID) === String(r.student_ID));
        if (!p || [p.A,p.B,p.C,p.D].some(v => v === null || isNaN(v) || v < 0)) return { ...r, status: 'error' };
        return r;
      });
      setRows(newRows);
      toast.error(`There are ${invalid.length} invalid rows. Fill all A-D (0-100) before saving.`);
      return;
    }

    setLoading(true);
    // mark all as saving
    setRows(prev => prev.map(r => ({ ...r, status: 'saving' })));

    const ops = prepared.map((payload) =>
      AdminAPI.createResult(payload)
        .then(res => ({ ok: true, res, payload }))
        .catch(err => ({ ok: false, err, payload }))
    );

    const results = await Promise.all(ops);

    const newRows = [...rows];
    results.forEach((r) => {
      const sid = r.payload.student_ID;
      const idx = newRows.findIndex(row => String(row.student_ID) === String(sid));
      if (r.ok) {
        const created = r.res.data?.result || r.res.data || r.res;
        const total = created.total ?? (created.A + created.B + created.C + created.D) ?? (r.payload.A + r.payload.B + r.payload.C + r.payload.D);
        const percentage = created.percentage ?? (total / 400) * 100;
        let scholarShipCategory = "No Scholarship";
        if (percentage >= 95) scholarShipCategory = "100% Scholarship";
        else if (percentage >= 85) scholarShipCategory = "50% Scholarship";
        else if (percentage >= 75) scholarShipCategory = "25% Scholarship";
        else if (percentage >= 60) scholarShipCategory = "10% Scholarship";
        const updated = {
          ...(idx !== -1 ? newRows[idx] : { student_ID: sid, fullName: created.studentName || '' }),
          A: created.A ?? r.payload.A,
          B: created.B ?? r.payload.B,
          C: created.C ?? r.payload.C,
          D: created.D ?? r.payload.D,
          total,
          percentage: Number(percentage).toFixed(2),
          scholarShip: scholarShipCategory,
          status: 'created'
        };
        if (idx !== -1) newRows[idx] = updated; else newRows.push(updated);
      } else {
        if (idx !== -1) newRows[idx] = { ...newRows[idx], status: 'error' };
      }
    });

    setRows(newRows);
    const failed = results.filter(r => !r.ok);
    if (failed.length) toast.warn(`${failed.length} rows failed to save. Check console for details.`);
    else toast.success('All rows saved successfully.');
    setLoading(false);
  };

  // small helper to update cell locally
  const updateCell = (index, key, value) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], [key]: value };
    // if all A-D are numbers we can compute preview total locally
    const A = Number(copy[index].A) || 0;
    const B = Number(copy[index].B) || 0;
    const C = Number(copy[index].C) || 0;
    const D = Number(copy[index].D) || 0;
    if ([copy[index].A, copy[index].B, copy[index].C, copy[index].D].every(v => v !== "")) {
      const total = A+B+C+D;
      const percentage = (total / 400) * 100;
      copy[index].total = total;
      copy[index].percentage = Number(percentage).toFixed(2);
      // scholarship preview using same logic as backend
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Result Management</h2>
      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={exportTemplate} disabled={loading || rows.length===0}>
          Export Template (Excel)
        </button>
        <label className="px-4 py-2 rounded bg-green-600 text-white cursor-pointer">
          Import Excel
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onFileChange} style={{ display: 'none' }} />
        </label>
        <button className="px-4 py-2 rounded bg-indigo-700 text-white" onClick={saveAll} disabled={loading || rows.length===0}>
          Save All to DB
        </button>
        <button className="px-4 py-2 rounded bg-gray-600 text-white" onClick={fetchStudents} disabled={loading}>
          Refresh Students
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2">Student ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">A</th>
              <th className="px-3 py-2">B</th>
              <th className="px-3 py-2">C</th>
              <th className="px-3 py-2">D</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">%</th>
              <th className="px-3 py-2">Scholarship</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student_ID} className={r.status==='error'? 'bg-red-50' : r.status==='saving' ? 'bg-yellow-50' : ''}>
                <td className="px-3 py-2">{r.student_ID}</td>
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2"><input value={r.A} onChange={(e)=>updateCell(i,'A',e.target.value)} style={{width:70}} /></td>
                <td className="px-3 py-2"><input value={r.B} onChange={(e)=>updateCell(i,'B',e.target.value)} style={{width:70}} /></td>
                <td className="px-3 py-2"><input value={r.C} onChange={(e)=>updateCell(i,'C',e.target.value)} style={{width:70}} /></td>
                <td className="px-3 py-2"><input value={r.D} onChange={(e)=>updateCell(i,'D',e.target.value)} style={{width:70}} /></td>
                <td className="px-3 py-2">{r.total}</td>
                <td className="px-3 py-2">{r.percentage}</td>
                <td className="px-3 py-2">{r.scholarShip}</td>
                <td className="px-3 py-2">
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={10} className="p-4 text-center">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
