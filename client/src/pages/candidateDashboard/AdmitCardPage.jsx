// src/pages/AdmitCardPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { AdmitCardAPI, AuthAPI } from "../../config/api.js";
import logo from '../../assets/admitcardheader.png';
import toast from 'react-hot-toast';

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdmitCardPage() {
  const [admitCard, setAdmitCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    const loadAdmitCard = async () => {
      try {
        const profileRes = await AuthAPI.getStudentProfile();
        const profile = profileRes?.data?.student || profileRes?.data || {};
        const student_ID = profile.student_ID;

        if (!student_ID) {
          setError("Student ID not found in profile.");
          return;
        }

        const response = await AdmitCardAPI.getAdmitCardById(student_ID);
        const card = response?.data?.data || response?.data || response;

        if (!card) {
          setError("Admit card not found.");
          return;
        }

        setAdmitCard(card);

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

  // Simple solution - create a clean HTML structure for PDF
  const createPDFContent = () => {
    return `
      <div style="font-family: Arial, sans-serif; width: 100%; padding: 15px; background: white; color: black; box-sizing: border-box;">
        <!-- Header - More Compact -->
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="flex: 1;">
              <img src="${logo}" alt="RICR Logo" style="height: 50px; width: auto; max-width: 150px;" />
            </div>
            <div style="flex: 1; text-align: center;">
              <h1 style="font-size: 16px; font-weight: bold; color: black; margin: 0;">Scholarship Admission Test</h1>
              <p style="font-size: 12px; font-weight: bold; color: black; margin: 2px 0 0 0;">ADMIT CARD</p>
            </div>
            <div style="flex: 1; text-align: right; justify-content: flex-end; display: flex; align-items: center;">
              ${qrUrl ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}" alt="QR Code" style="border: 1px solid #000; padding: 3px; width: 60px; height: 60px;" />` : ''}
            </div>
          </div>
        </div>

        <!-- Student Info - More Compact -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Applicant</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.ApplicantName || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">R-SAT ID</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.RSAT || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Contact</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.contact || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">College</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.college || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Branch</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.branch || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Year</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.year || "-"}</p>
          </div>
        </div>

        <!-- Exam Info - More Compact -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Venue</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.venue || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Exam Date</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.examDate ? new Date(admitCard.examDate).toLocaleDateString() : "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Exam Time</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.examTime || "-"}</p>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; color: #111827; margin: 0 0 3px 0;">Reporting Time</p>
            <p style="font-size: 11px; color: #374151; margin: 0; line-height: 1.2;">${admitCard.ReportingTime || "-"}</p>
          </div>
        </div>

        <div style="border-bottom: 1px solid #d1d5db; margin: 10px 0;"></div>

        <!-- Instructions - More Compact -->
        <div style="margin-top: 10px;">
          <h3 style="font-size: 14px; font-weight: bold; color: black; text-align: center; margin: 0 0 8px 0;">Instructions for Exam</h3>
          <ul style="color: #374151; font-size: 10px; line-height: 1.3; padding-left: 12px; margin: 0;">
            <li style="margin-bottom: 4px;">Admit card must be in hard copy format. Digital copies will not be accepted.</li>
            <li style="margin-bottom: 4px;">Carry a valid photo ID proof with this Admit Card.</li>
            <li style="margin-bottom: 4px;">The exam will be conducted offline using an OMR sheet. Ensure to carry a blue or black ballpoint pen for marking answers.</li>
            <li style="margin-bottom: 4px;">Electronic devices like mobile phones, smartwatches, or calculators are strictly prohibited in the examination hall.</li>
            <li style="margin-bottom: 4px;">OMR sheets should be handled carefully and not folded or damaged.</li>
            <li style="margin-bottom: 4px;">Follow all instructions provided by the invigilators during the exam.</li>
            <li style="margin-bottom: 4px;">Rough work can be done on the pages provided at the venue.</li>
          </ul>

          <!-- Downloads Info - Compact -->
          <div style="margin-top: 8px;">
            <p style="font-size: 10px; color: #6b7280; margin: 0;">
              <strong>Downloads:</strong> ${admitCard.downloadCount || 0}
              ${admitCard.downloadedAt ? `<span style="margin-left: 8px; font-size: 9px; color: #9ca3af;">Last: ${new Date(admitCard.downloadedAt).toLocaleString()}</span>` : ''}
            </p>
          </div>

          <p style="text-align: center; margin-top: 10px; font-size: 9px; color: #6b7280; line-height: 1.2;">
            For any queries, contact us at <span style="color: #2563eb; font-weight: bold;">contact@ricr.in</span> or call +918889991736/ +919907096014
          </p>
        </div>
      </div>
    `;
  };

  const prepareAndCapturePdf = async () => {
    setAdmitCard(prev => ({
      ...prev,
      downloadCount: (prev?.downloadCount || 0) + 1,
      downloadedAt: new Date().toISOString(),
    }));

    await new Promise(resolve => setTimeout(resolve, 100));
    await handleDownloadPdf();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      toast.loading("Preparing PDF...", { id: "download" });

      // Create a temporary div with simple HTML structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = createPDFContent();
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '580px'; // Slightly smaller to fit everything
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '10px';
      tempDiv.style.boxSizing = 'border-box';
      document.body.appendChild(tempDiv);

      // Wait for images to load
      const images = tempDiv.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 1000);
            }
          });
        })
      );

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgHeight / imgWidth;
      const pdfImgHeight = pdfWidth * ratio;

      // Check if content fits on one page
      if (pdfImgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImgHeight);
      } else {
        // If too tall, scale down to fit one page
        const scaleFactor = pdfHeight / pdfImgHeight;
        const scaledWidth = pdfWidth * scaleFactor * 0.95; // 95% to add some margin
        const scaledHeight = pdfImgHeight * scaleFactor * 0.95;
        pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, 5, scaledWidth, scaledHeight);
      }

      const filename = `${admitCard.RSAT || 'admit-card'}.pdf`;
      pdf.save(filename);

      toast.success("PDF downloaded successfully!", { id: "download" });

    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error('Failed to create PDF', { id: "download" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!admitCard) return <div className="text-center py-10">No Admit Card Found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md border">
      {/* Display area (what user sees) */}
      <div ref={printRef} className="p-3 bg-white">
        {/* Header */}
        <div className="text-center mb-4 border-b border-gray-300 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <img
                src={logo}
                alt="RICR Logo"
                className="h-10 sm:h-12 mx-auto sm:mx-0 mb-1 sm:mb-2 w-auto max-w-[150px] sm:max-w-[180px]"
              />
            </div>

            <div className="text-center flex-1">
              <h1 className="text-sm sm:text-base font-bold text-black">
                Scholarship Admission Test
              </h1>
              <p className="text-xs font-bold text-black">ADMIT CARD</p>
            </div>

            {/* QR Code */}
            <div className="flex-1 flex justify-center sm:justify-end">
              {qrUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code"
                  className="border border-gray-400 p-1 w-12 h-12 sm:w-14 sm:h-14 bg-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-center">
          <Detail label="Applicant" value={admitCard.ApplicantName} />
          <Detail label="R-SAT ID" value={admitCard.RSAT} />
          <Detail label="Contact" value={admitCard.contact} />
          <Detail label="College" value={admitCard.college} />
          <Detail label="Branch" value={admitCard.branch} />
          <Detail label="Year" value={admitCard.year} />
        </div>

        {/* Exam Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-center">
          <Detail label="Venue" value={admitCard.venue} />
          <Detail
            label="Exam Date"
            value={admitCard.examDate ? new Date(admitCard.examDate).toLocaleDateString() : "-"}
          />
          <Detail label="Exam Time" value={admitCard.examTime} />
          <Detail label="Reporting Time" value={admitCard.ReportingTime} />
        </div>

        <div className="border-b border-gray-300 mt-4"></div>

        {/* Instructions */}
        <div className="pt-3">
          <h3 className="text-sm font-bold mb-2 text-center text-black">
            Instructions for Exam
          </h3>
          <ul className="space-y-1 text-gray-700 text-xs">
            {[
              "Admit card must be in hard copy format. Digital copies will not be accepted.",
              "Carry a valid photo ID proof with this Admit Card.",
              "The exam will be conducted offline using an OMR sheet. Ensure to carry a blue or black ballpoint pen for marking answers.",
              "Electronic devices like mobile phones, smartwatches, or calculators are strictly prohibited in the examination hall.",
              "OMR sheets should be handled carefully and not folded or damaged.",
              "Follow all instructions provided by the invigilators during the exam.",
              "Rough work can be done on the pages provided at the venue."
            ].map((instruction, index) => (
              <li key={index} className="flex items-start">
                <span className="text-black mr-1 mt-0.5 text-xs">•</span>
                <span className="text-xs">{instruction}</span>
              </li>
            ))}
          </ul>

          {/* Downloads info */}
          <div className="mt-3">
            <p className="text-xs text-gray-600">
              <strong>Downloads:</strong> {admitCard.downloadCount || 0}
              {admitCard.downloadedAt && (
                <span className="ml-2 text-xs text-gray-500">
                  Last: {new Date(admitCard.downloadedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>

          <p className="text-center mt-3 text-xs text-gray-600">
            For any queries, contact us at{" "}
            <a href="mailto:contact@ricr.in" className="text-blue-600 font-semibold">
              contact@ricr.in
            </a>{" "}
            or call +918889991736/ +919907096014
          </p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={prepareAndCapturePdf}
          disabled={downloading}
          className={`px-6 py-2 rounded-md text-white font-semibold ${
            downloading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {downloading ? 'Preparing PDF...' : 'Download Admit Card'}
        </button>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div className="bg-gray-50 p-2 rounded border border-gray-200">
    <p className="text-xs font-bold text-gray-900">{label}</p>
    <p className="text-xs text-gray-700 break-words">{value || "-"}</p>
  </div>
);