import React, { useState } from "react";
import { AdminAPI } from "../../config/api";
import { FiCamera, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { QrReader } from "react-qr-reader";
export default function AdminQRScanner({ onAttendanceMarked }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [status, setStatus] = useState("");

  const handleScan = async (data) => {
    if (data) {
      setScanResult(data);
      setScanning(false);
      setStatus("Processing...");
      // Extract admit card id from QR data (assume it's just the id or a URL with id)
      let admitCardId = data;
      try {
        const url = new URL(data);
        const parts = url.pathname.split("/").filter(Boolean);
        admitCardId = parts[parts.length - 1];
      } catch (e) {
        // not a URL, use as is
      }
      if (!admitCardId || !/^[0-9a-fA-F]{24}$/.test(admitCardId)) {
        setStatus("Invalid QR code. Not a valid admit card id.");
        return;
      }
      // 1) generate present token
      try {
        const tokenRes = await AdminAPI.generatePresentToken(admitCardId);
        const presentToken = tokenRes?.data?.token;
        if (!presentToken) {
          setStatus("Failed to get token. Are you logged in as admin?");
          return;
        }
        // 2) mark attendance
        const markRes = await AdminAPI.markAttendanceWithToken({ token: presentToken });
        if (markRes?.data?.ok) {
          setStatus(markRes.data.alreadyPresent ? "Attendance already marked." : "Attendance marked successfully!");
          if (onAttendanceMarked) onAttendanceMarked(admitCardId, markRes.data);
        } else {
          setStatus(markRes?.data?.message || "Marking failed");
        }
      } catch (err) {
        setStatus("Error occurred. Check console.");
        console.error(err);
      }
    }
  };

  const handleError = (err) => {
    setStatus("Camera error: " + err.message);
    setScanning(false);
  };

  return (
    <div className="mb-6 mt-20">
      <button
        onClick={() => setScanning(true)}
        className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm mb-2"
      >
        <FiCamera className="w-4 h-4" />
        Scan Admit Card QR
      </button>
      {scanning && (
        <div className="mb-4">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
          />
          <button
            onClick={() => setScanning(false)}
            className="mt-2 px-3 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      )}
      {status && (
        <div className={`p-3 rounded-lg border ${status.includes("successfully") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <div className="flex items-center">
            {status.includes("successfully") ? (
              <FiCheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <FiAlertCircle className="w-4 h-4 mr-2" />
            )}
            <span className="text-sm">{status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
