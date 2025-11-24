import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AdminAPI } from "../../config/api"; // your Admin API wrapper
import { FiCamera, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function AdminQRScanner({ onAttendanceMarked }) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const scannerRef = useRef(null);
  const qrRegionId = "html5qr-scanner-region";

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (scanning) return;
    setStatus("");
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId, /* verbose */ false);
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: 250 };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText /* decodedResult */) => {
          // stop asap after successful read
          html5QrCode
            .stop()
            .then(() => html5QrCode.clear())
            .catch(() => {});
          setScanning(false);
          handleScanned(decodedText);
        },
        (errorMessage) => {
          // per-frame error (ignore)
        }
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      setStatus("Could not start camera. Check site permissions (HTTPS) or camera availability.");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) {
      setScanning(false);
      return;
    }
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (e) {
      /* ignore */
    }
    setScanning(false);
  };

  const handleScanned = async (data) => {
    setStatus("Processing scanned data...");
    // extract admit card id from URL or plain id
    const extractId = (value) => {
      try {
        const u = new URL(value);
        const parts = u.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        if (/^[0-9a-fA-F]{24}$/.test(last)) return last;
        if (u.searchParams.get("id")) return u.searchParams.get("id");
      } catch (e) {
        // not a URL
      }
      return (value || "").trim();
    };

    const admitCardId = extractId(data);
    if (!admitCardId || !/^[0-9a-fA-F]{24}$/.test(admitCardId)) {
      setStatus("Invalid QR: not a valid admit-card id or URL.");
      return;
    }

    try {
      // 1) generate present token (ADMIN-only endpoint)
      const tokenRes = await AdminAPI.generatePresentToken(admitCardId);
      const presentToken = tokenRes?.data?.token;
      if (!presentToken) {
        setStatus("Failed to get present token — ensure you're logged in as admin.");
        return;
      }

      // 2) mark attendance using token
      const markRes = await AdminAPI.markAttendanceWithToken({ token: presentToken });
      if (markRes?.data?.ok) {
        const already = !!markRes.data.alreadyPresent;
        setStatus(already ? "Attendance already marked." : "Attendance marked successfully!");
        if (onAttendanceMarked) onAttendanceMarked(admitCardId, markRes.data);
      } else {
        setStatus(markRes?.data?.message || "Attendance marking failed.");
      }
    } catch (err) {
      console.error("Attendance error:", err);
      setStatus("Server error while marking attendance. Check console.");
    }
  };

  return (
    <div className="mb-6 mt-20">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={startScanner}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 text-sm"
        >
          <FiCamera className="w-4 h-4" />
          {scanning ? "Scanning..." : "Scan Admit Card QR"}
        </button>

        <button
          onClick={stopScanner}
          disabled={!scanning}
          className="px-3 py-2 bg-gray-200 rounded text-sm"
        >
          Cancel
        </button>
      </div>

      <div id={qrRegionId} style={{ width: 340, height: 340 }} className="mx-auto border" />

      {status && (
        <div
          className={`p-3 rounded-lg mt-3 ${
            status.toLowerCase().includes("success") ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {status.toLowerCase().includes("success") ? <FiCheckCircle /> : <FiAlertCircle />}
            <span className="text-sm">{status}</span>
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-500">Admin must be logged in for token generation.</p>
    </div>
  );
}
