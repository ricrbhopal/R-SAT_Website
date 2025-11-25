// src/pages/AdmitCardPage.jsx
import React, { useEffect, useState } from "react";
import { AdmitCardAPI, AuthAPI } from "../../config/api.js";
import logo from '../../assets/admitcardheader.png';

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

        // STEP-3: Generate QR URL with random token
        const randomToken = Math.random().toString(36).substring(2, 12);
        const scanUrl = `https://rsat.ricr.in/api/admit-cards/scan-attendance/${card._id}?token=${randomToken}`;
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
  if (error)
    return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!admitCard)
    return <div className="text-center py-10">No Admit Card Found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md border">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 relative border-b border-gray-300 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <img
              src={logo}
              alt="RICR Logo"
              className="h-12 sm:h-15 mx-auto sm:mx-0 mb-2 sm:mb-3 w-auto max-w-[180px] sm:max-w-[200px]"
            />
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-base sm:text-sm text-black font-bold"> Scholarship Admission Test</h1>
            <p className="text-[12px] sm:text-[12px] font-bold">ADMIT CARD</p>
          </div>

          {/* QR Code */}
          <div className="flex-1 flex justify-center sm:justify-end">
            {qrUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  qrUrl
                )}`}
                alt="QR Code"
                className="border p-1 sm:p-2 w-16 h-16 sm:w-20 sm:h-20"
              />
            )}
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-center">
        <Detail label="Applicant" value={admitCard.ApplicantName} />
        <Detail label="R-SAT ID" value={admitCard.RSAT} />
        <Detail label="Contact" value={admitCard.contact} />
        <Detail label="College" value={admitCard.college} />
        <Detail label="Branch" value={admitCard.branch} />
        <Detail label="Year" value={admitCard.year} />
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-center">
        <Detail label="Venue" value={admitCard.venue} />
        <Detail
          label="Exam Date"
          value={new Date(admitCard.examDate).toLocaleDateString()}
        />
        <Detail label="Exam Time" value={admitCard.examTime} />
        <Detail label="Reporting Time" value={admitCard.ReportingTime} />
      </div>
      
      <div className="border-b border-gray-300 mt-6 sm:mt-10"></div>
      
      {/* Instructions */}
      <div className="pt-3 sm:pt-4">
        <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-center sm:text-left">Instructions for Exam</h3>
        <ul className="space-y-2 text-gray-700 text-xs sm:text-sm">
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>Admit card must be in hard copy format. Digital copies will not be accepted.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>Carry a valid photo ID proof with this Admit Card.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>The exam will be conducted offline using an OMR sheet. Ensure to carry a blue or black ballpoint pen for marking answers.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>Electronic devices like mobile phones, smartwatches, or calculators are strictly prohibited in the examination hall.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>OMR sheets should be handled carefully and not folded or damaged.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>Follow all instructions provided by the invigilators during the exam.</span>
          </li>
          <li className="flex items-start">
            <span className="text-black mr-2 mt-0.5">•</span>
            <span>Rough work can be done on the pages provided at the venue.</span>
          </li>
        </ul>
        <p className="text-center mt-4 sm:mt-5 text-[10px] sm:text-[10px]">
          For any queries, contact us at{" "}
          <a
            href="mailto:contact@ricr.in"
            className="text-blue-600 font-semibold"
          >
            contact@ricr.in
          </a>{" "}
          or call +918889991736/ +919907096014
        </p>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div className="bg-gray-50 p-2 sm:p-3 rounded border border-gray-200">
    <p className="text-[14px] sm:text-[16px] font-bold text-gray-900">{label}</p>
    <p className="text-[13px] sm:text-[15px] text-gray-700 break-words">{value || "-"}</p>
  </div>
);