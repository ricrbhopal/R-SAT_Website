// src/pages/AdmitCardPage.jsx
import React, { useEffect, useState } from "react";
import { AdmitCardAPI, AuthAPI } from "../../config/api.js";

export default function AdmitCardPage() {
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const loadAdmitCard = async () => {
      try {
        // STEP-1: Get profile
        const profileRes = await AuthAPI.getStudentProfile();
        const profile = profileRes?.data?.student || profileRes?.data || {};
        const student_ID = profile.student_ID;

        if (!student_ID) {
          setError("Student ID not found in profile.");
          return;
        }

        // STEP-2: Get Admit Card
        const response = await AdmitCardAPI.getAdmitCardById(student_ID);
        const card = response?.data?.data || response?.data || response;

        if (!card) {
          setError("Admit card not found.");
          return;
        }

        setAdmitCard(card);

        // STEP-3: Generate QR URL
        const scanUrl = `http://localhost:6501/api/admit-cards/scan-attendance?id=${card._id}`;
        setQrUrl(scanUrl);
      } catch (err) {
        console.error(err);
        setError("Could not load admit card.");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCard();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!admitCard) return <div className="text-center py-10">No Admit Card Found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border">

      {/* Header */}
      <div className="text-center mb-6">
        <img src="/logo.png" alt="RICR Logo" style={{ width: 100 }} className="mx-auto mb-3" />
        <h1 className="text-2xl font-bold">RICR Scholarship Admission Test</h1>
        <p className="text-lg font-semibold">ADMIT CARD</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Detail label="Applicant" value={admitCard.ApplicantName} />
        <Detail label="R-SAT ID" value={admitCard.RSAT} />
        <Detail label="Contact" value={admitCard.contact} />
        <Detail label="College" value={admitCard.college} />
        <Detail label="Branch" value={admitCard.branch} />
        <Detail label="Year" value={admitCard.year} />
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Detail label="Venue" value={admitCard.venue} />
        <Detail label="Exam Date" value={new Date(admitCard.examDate).toLocaleDateString()} />
        <Detail label="Exam Time" value={admitCard.examTime} />
        <Detail label="Reporting Time" value={admitCard.ReportingTime} />
      </div>

      {/* Instructions */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-bold mb-2">Instructions:</h3>
        <ul className="list-disc list-inside text-gray-700 text-sm">
          <li>Admit Card must be printed.</li>
          <li>Carry valid Photo ID.</li>
          <li>No gadgets allowed in exam hall.</li>
          <li>Follow all instructions from the invigilator.</li>
        </ul>
      </div>

      {/* QR Code */}
      <div className="text-center mt-8">
        <h3 className="text-lg font-semibold mb-3">Scan QR to Mark Attendance</h3>

        {qrUrl && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              qrUrl
            )}`}
            alt="QR Code"
            className="mx-auto border p-2"
          />
        )}

        <p className="mt-2 text-sm text-gray-500">
          Use any mobile scanner (Google Lens / Camera) to mark your attendance.
        </p>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg font-bold text-gray-900">{value || "-"}</p>
  </div>
);
