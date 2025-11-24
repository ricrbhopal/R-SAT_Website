// src/pages/AdmitCardPage.jsx
import React, { useEffect, useState } from "react";
import { AdmitCardAPI, AuthAPI } from "../../config/api.js";

export default function AdmitCardPage() {
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState(""); // QR code URL
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAdmitCard = async () => {
      setLoading(true);
      setError("");

      try {
        /** STEP 1: FETCH PROFILE */
        const profileRes = await AuthAPI.getStudentProfile();
        const profile = profileRes?.data?.student || profileRes?.data || {};
        const student_ID = profile.student_ID || profile.studentId || profile._id || profile.id;

        if (!student_ID) {
          setError("Student ID not found in profile.");
          setLoading(false);
          return;
        }

        /** STEP 2: FETCH ADMIT CARD */
        const response = await AdmitCardAPI.getAdmitCardById(student_ID);
        const card = response?.data?.data || response?.data || response;

        if (!card) {
          setError("Admit card not found.");
          return;
        }

        setAdmitCard(card);

        /** STEP 3: GENERATE QR URL (scan → mark attendance) */
        // Use the API helper endpoint for scanning (configured in AdmitCardAPI)
        // We provide a direct URL that the mobile scanner will open — backend should mark attendance and return a message or redirect.
        const qrLink = `${window.location.protocol}//${window.location.hostname}${window.location.port ? 
          ":" + window.location.port : ""}/api/admitcards/scan-attendance?id=${encodeURIComponent(card._id)}`;
        // If your backend runs on a different origin (eg http://localhost:6501), replace with that base.
        // const qrLink = `http://localhost:6501/api/admitcards/scan-attendance?id=${encodeURIComponent(card._id)}`;
        setQrUrl(qrLink);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch admit card.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmitCard();
  }, []);

  // optional: allow manual scan-trigger from web (for testing)
  const handleScanTest = async () => {
    if (!admitCard) return;
    setMessage("");
    try {
      // call the scanAttendance API helper (uses GET)
      const res = await AdmitCardAPI.scanAttendance(admitCard._id);
      const data = res?.data || res;
      setMessage(typeof data === 'string' ? data : (data.message || JSON.stringify(data)));
    } catch (err) {
      console.error(err);
      setMessage("Scan test failed.");
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!admitCard) return <div className="text-center py-8">No admit card found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border">

      {/* Header */}
      <div className="text-center mb-6">
        {/* Logo: using uploaded local image path */}
        <img
          src="sandbox:/mnt/data/1-310-1024x794.jpg"
          alt="RICR Logo"
          className="mx-auto mb-4"
          style={{ width: "100px" }}
        />
        <h1 className="text-2xl font-bold">RICR Scholarship Admission Test</h1>
        <h2 className="text-lg font-semibold">ADMIT CARD</h2>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Detail label="Applicant" value={admitCard.ApplicantName} />
        <Detail label="R-SAT ID" value={admitCard.RSAT} />
        <Detail label="Contact" value={admitCard.contact} />
        <Detail label="College" value={admitCard.college} />
        <Detail label="Branch" value={admitCard.branch} />
        <Detail label="Year" value={admitCard.year} />
      </div>
{/* //kjhnj */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Detail label="Venue" value={admitCard.venue} />
        <Detail label="Exam Date" value={admitCard.examDate ? new Date(admitCard.examDate).toLocaleDateString() : "-"} />
        <Detail label="Exam Time" value={admitCard.examTime} />
        <Detail label="Reporting Time" value={admitCard.ReportingTime} />
      </div>

      {/* Instructions */}
      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Instructions for Exam:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Admit Card must be printed. Digital copies are not allowed.</li>
          <li>Carry a valid photo ID proof.</li>
          <li>No electronic gadgets allowed inside the exam hall.</li>
          <li>Follow invigilator instructions strictly.</li>
        </ul>
      </div>

      {/* QR Code Attendance */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold mb-3">Scan QR to Mark Attendance</h3>

        {qrUrl && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            className="mx-auto border p-2"
          />
        )}

        <p className="mt-2 text-sm text-gray-500">Use any scanner app (Camera / Google Lens) to mark your attendance.</p>

        {/* Optional manual test button for devs (calls backend scan endpoint) */}
        <div className="mt-4">
          <button onClick={handleScanTest} className="px-4 py-2 bg-blue-600 text-white rounded">Test Scan (dev)</button>
        </div>

        {message && <div className="mt-2 text-green-700 font-semibold">{message}</div>}
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-lg font-bold text-gray-900">{value || "-"}</p>
  </div>
);
