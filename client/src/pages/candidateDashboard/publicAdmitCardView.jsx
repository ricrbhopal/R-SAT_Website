// src/pages/PublicAdmitCardView.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { AdminAPI } from "../config/api";

export default function PublicAdmitCardView() {
  const { idOrRsat } = useParams();
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublic = async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await AdminAPI.getPublicAdmitCard(idOrRsat);
        const payload = resp?.data?.data || resp?.data || resp;
        if (!payload) throw new Error("Admit card not found");
        setAdmitCard(payload);
      } catch (err) {
        console.error("Failed to load public admit:", err);
        setError(err?.message || "Unable to load admit card");
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, [idOrRsat]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!admitCard) return <div className="text-center py-8">No admit card found.</div>;

  const publicUrl = `${process.env.REACT_APP_BASE_URL || window.location.origin}/public/admit/${encodeURIComponent(admitCard._id || admitCard.RSAT)}`;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border">
      <div className="text-center mb-6">
        <img src="/logo.png" alt="RICR Logo" className="mx-auto mb-4" style={{ maxWidth: "100px" }} />
        <h1 className="text-2xl font-bold">RICR Scholarship Admission Test</h1>
        <h2 className="text-lg font-semibold">ADMIT CARD</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Applicant</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.ApplicantName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">R-SAT ID</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.RSAT}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Contact</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.contact}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">College</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.college}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Branch</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.branch}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Year</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.year}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Venue</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.venue}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Exam Date</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.examDate ? new Date(admitCard.examDate).toLocaleDateString() : "-"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Exam Time</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.examTime}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Reporting Time</p>
          <p className="text-lg font-bold text-gray-900">{admitCard.ReportingTime}</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm font-medium text-gray-500 mb-2">This page was opened via QR / public link</p>
        <QRCode value={publicUrl} size={128} />
      </div>

      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Instructions for Exam:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Admit Card must be in hard copy format. Digital copies will not be accepted.</li>
          <li>Carry a valid photo ID proof along with this Admit Card.</li>
          <li>Follow invigilator instructions.</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">For any queries, contact us at <a href="mailto:contact@ricr.in" className="text-blue-500">contact@ricr.in</a>.</p>
      </div>
    </div>
  );
}
