// src/pages/AdmitCardPage.jsx
import React, { useEffect, useState } from "react";
import { AdmitCardAPI, AuthAPI } from "../../config/api.js";

export default function AdmitCardPage() {
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdmitCard = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch student profile to get student_ID
        const profileRes = await AuthAPI.getStudentProfile();
        const profile = profileRes?.data?.student || profileRes?.data || {};
        const student_ID = profile.student_ID;
        if (!student_ID) {
          setError("Student ID not found in profile.");
          setLoading(false);
          return;
        }
        // Fetch admit card using AdmitCardAPI (now supports student_ID or _id)
        const response = await AdmitCardAPI.getAdmitCardById(student_ID);
        const payload = response?.data?.data || response?.data || response;
        if (payload?.studentId === profile.id || payload?.RSAT === student_ID) {
          setAdmitCard(payload);
        } else {
          setError("Admit card not found for this student.");
        }
      } catch (err) {
        console.error("Error fetching admit card:", err);
        setError("Failed to fetch admit card.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmitCard();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!admitCard)
    return <div className="text-center py-8">No admit card found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border">
      {/* Header */}
      <div className="text-center mb-6">
        <img
          src="/logo.png"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Detail label="Venue" value={admitCard.venue} />
        <Detail
          label="Exam Date"
          value={
            admitCard.examDate
              ? new Date(admitCard.examDate).toLocaleDateString()
              : "-"
          }
        />
        <Detail label="Exam Time" value={admitCard.examTime} />
        <Detail label="Reporting Time" value={admitCard.ReportingTime} />
      </div>

      {/* Footer */}
      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Instructions for Exam:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Admit Card must be printed. Digital copies are not allowed.</li>
          <li>Carry a valid photo ID proof.</li>
          <li>No electronic gadgets allowed inside exam hall.</li>
          <li>Follow invigilator instructions strictly.</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          For queries:{" "}
          <a href="mailto:contact@ricr.in" className="text-blue-500">
            contact@ricr.in
          </a>
        </p>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-lg font-bold text-gray-900">{value}</p>
  </div>
);
