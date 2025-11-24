// src/pages/admin/AdminMarkPage.jsx
import React, { useState } from "react";
import { AdmitCardAPI } from "../../config/api.js"; // your api wrapper

export default function AdminMarkPage() {
  const [idOrUrl, setIdOrUrl] = useState("");
  const [status, setStatus] = useState("");

  const extractId = (value) => {
    // if a full URL is pasted, try to get last path or query param
    try {
      const u = new URL(value);
      // check path last segment
      const parts = u.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (/^[0-9a-fA-F]{24}$/.test(last)) return last;
      // try query param id
      if (u.searchParams.get("id")) return u.searchParams.get("id");
    } catch (e) {
      // not a URL, maybe just ID
    }
    return value.trim();
  };

  const handleMark = async () => {
    setStatus("Processing...");
    try {
      const id = extractId(idOrUrl);
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setStatus("Invalid id or URL. Paste admit-card URL or its id.");
        return;
      }

      // 1) generate present token — Admin API call (requires admin auth cookie/token)
      const tokenRes = await AdmitCardAPI.generatePresentToken(id);
      const presentToken = tokenRes?.data?.token;
      if (!presentToken) {
        setStatus("Failed to get token. Are you logged in as admin?");
        return;
      }

      // 2) mark attendance with token
      const markRes = await AdmitCardAPI.markAttendanceWithToken({ token: presentToken });
      if (markRes?.data?.ok) {
        setStatus(markRes.data.alreadyPresent ? "Already marked" : "Marked successfully");
      } else {
        setStatus(markRes?.data?.message || "Marking failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error occurred. Check console.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin — Scan / Paste AdmitCard URL or ID</h2>

      <textarea
        value={idOrUrl}
        onChange={(e) => setIdOrUrl(e.target.value)}
        placeholder="Paste scanned QR URL or admitCard id here"
        className="w-full border p-2 mb-3"
        rows={3}
      />

      <button onClick={handleMark} className="px-4 py-2 bg-blue-600 text-white rounded">
        Mark Attendance (Admin)
      </button>

      <div className="mt-3 text-sm">{status}</div>
    </div>
  );
}
