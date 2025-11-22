import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../config/api";
import QRCode from "react-qr-code";

export default function AdmitCardPage() {
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdmitCard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await AdminAPI.getAdmitCardById("69217b4885f965da0518d54b"); // Replace with dynamic ID if needed
        if (response.status === 200) {
          setAdmitCard(response.data);
        } else {
          setError("Failed to fetch admit card details.");
        }
      } catch (err) {
        console.error("Error fetching admit card:", err);
        setError("An error occurred while fetching the admit card.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmitCard();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!admitCard) {
    return <div className="text-center py-8">No admit card found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border">
      {/* Header */}
      <div className="text-center mb-6">
        <img src="/public/logo.png" alt="RICR Logo" className="mx-auto mb-4" style={{ maxWidth: "100px" }} />
        <h1 className="text-2xl font-bold">RICR Scholarship Admission Test</h1>
        <h2 className="text-lg font-semibold">ADMIT CARD</h2>
      </div>

      {/* Admit Card Details */}
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
          <p className="text-lg font-bold text-gray-900">{new Date(admitCard.examDate).toLocaleDateString()}</p>
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

      {/* QR Code */}
      <div className="text-center mt-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Scan QR Code for Details</p>
        <QRCode value={JSON.stringify(admitCard)} size={128} />
      </div>

      {/* Footer */}
      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Instructions for Exam:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Admit Card must be in hard copy format. Digital copies will not be accepted.</li>
          <li>Carry a valid photo ID proof along with this Admit Card.</li>
          <li>The exam will be conducted offline using an OMR sheet. Ensure to carry a blue or black ballpoint pen for marking answers.</li>
          <li>Electronic devices like mobile phones, smartwatches, or calculators are strictly prohibited in the examination hall.</li>
          <li>OMR sheets should be handled carefully and not folded or damaged.</li>
          <li>Follow all instructions provided by the invigilators during the exam.</li>
          <li>Rough work can be done on the pages provided at the venue.</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">For any queries, contact us at <a href="mailto:contact@ricr.in" className="text-blue-500">contact@ricr.in</a> or call 9907906014 / 8889911736.</p>
      </div>
    </div>
  );
}

