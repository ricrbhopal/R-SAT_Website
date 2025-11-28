// AdmitCardManagePage.jsx
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../config/api";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiRefreshCw,
  FiSettings,
  FiCamera,
  FiX,
  FiMenu,
  FiUsers,
  FiFileText,
  FiSend,
  FiXCircle,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

// NOTE: keep your existing modal/scanner files in these paths
import EditModal from "./modals/AdmitCardModels/EditModal.jsx";
import DeleteModal from "./modals/AdmitCardModels/DeleteModels.jsx";
import BulkEditModal from "./modals/AdmitCardModels/BulkEditModals.jsx";
import UniversalScanner from "./modals/AdmitCardModels/scancer.jsx";

import CreateAdmitCard from "./modals/admitCardtab/CreateAdmitCard.jsx";
import Students from "./modals/admitCardtab/GetStudentFetch.jsx";
import AdmitCardTab from "./modals/admitCardtab/GetAdmitCard.jsx";

export default function AdmitCardManagePage() {
  // ---------- Shared state ----------
  const [students, setStudents] = useState([]);
  const [admitCards, setAdmitCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    venue: "",
    examDate: "",
    examTime: "",
    ReportingTime: "",
    status: "not_issued",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmitCard, setSelectedAdmitCard] = useState(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedAdmitCard, setExpandedAdmitCard] = useState(null);

  useEffect(() => {
    fetchAllStudents();
    fetchAllAdmitCards();
    // eslint-disable-next-line
  }, []);

  // ---------- API calls ----------
  const fetchAllStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAPI.getAllStudents();
      if (res && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        console.error("Unexpected students response:", res);
        setStudents([]);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError("Failed to load students.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAdmitCards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAPI.getAllAdmitCards();
      // this mirrors your original handling (res.data.data)
      if (res && res.data && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((card) => ({
          _id: card._id,
          studentId: card.studentId,
          ApplicantName: card.ApplicantName,
          contact: card.contact,
          college: card.college,
          branch: card.branch,
          year: card.year,
          RSAT: card.RSAT,
          venue: card.venue,
          examDate: card.examDate,
          examTime: card.examTime,
          ReportingTime: card.ReportingTime,
          status: card.status,
          emailSent: card.emailSent,
          present: typeof card.present === "boolean" ? card.present : false,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        }));
        setAdmitCards(formatted);
      } else {
        console.error("Unexpected admitCards response:", res);
        setAdmitCards([]);
      }
    } catch (err) {
      console.error("Error fetching admit cards:", err);
      setError("Failed to load admit cards.");
      setAdmitCards([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Handlers ----------
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkCreate = async () => {
    if (!form.venue || !form.examDate || !form.examTime || !form.ReportingTime) {
      setMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await AdminAPI.bulkCreateAdmitCards(form);
      setMessage({ type: "success", text: "Admit cards created successfully for all students!" });
      await fetchAllAdmitCards();
    } catch (err) {
      console.error("Failed to create admit cards", err);
      setMessage({ type: "error", text: "Failed to create admit cards." });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = (card) => {
    setSelectedCard(card);
    setShowDetailsModal(true);
  };

  const handleEditClick = (card) => {
    setSelectedAdmitCard(card);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (card) => {
    setSelectedAdmitCard(card);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedAdmitCard(null);
  };

  const handleBulkEditClick = () => setIsBulkEditModalOpen(true);
  const handleBulkEditClose = () => setIsBulkEditModalOpen(false);

  const refreshAdmitCards = async () => {
    await fetchAllAdmitCards();
  };

  // scanner result handler (same logic as your original)
  const handleScanResult = (scannedText) => {
    if (!scannedText) return;
    try {
      const trimmed = scannedText.trim();
      const expectedBase = "https://rsat.ricr.in/api/admit-cards/scan-attendance/";
      if (trimmed.startsWith(expectedBase)) {
        fetch(trimmed, {
          method: "GET",
          headers: { "x-official-scanner": "true" },
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.status === 403) {
              setScannerError("Attendance can only be marked using the official scanner.");
              alert("Unauthorized scanner. Attendance not marked.");
            } else if (data.message) {
              alert(data.message);
            } else {
              alert("Attendance marked successfully.");
            }
          })
          .catch((err) => {
            console.error(err);
            setScannerError("Error marking attendance. Try again.");
            alert("Error marking attendance.");
          })
          .finally(() => setIsScannerOpen(false));
      } else {
        setSearchTerm(trimmed);
        setActiveTab("admitCards");
        const matched = admitCards.find(
          (c) =>
            (c.RSAT && c.RSAT.toString().toLowerCase() === trimmed.toLowerCase()) ||
            (c._id && c._id.toString().toLowerCase() === trimmed.toLowerCase())
        );
        if (matched) {
          setSelectedCard(matched);
          setShowDetailsModal(true);
        }
        setIsScannerOpen(false);
        setScannerError("");
      }
    } catch (err) {
      console.error("Error processing scanned result:", err);
      setScannerError("Error processing scanned result.");
      alert("Error processing scanned result.");
      setIsScannerOpen(false);
    }
  };

  const handleScanError = (err) => {
    console.error("Scanner error:", err);
    setScannerError("Camera/permission error. Please allow camera access or try another device.");
  };

  // expand toggles
  const toggleStudentExpand = (id) => setExpandedStudent(expandedStudent === id ? null : id);
  const toggleAdmitCardExpand = (id) => setExpandedAdmitCard(expandedAdmitCard === id ? null : id);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  // filtered list for search
  const filteredAdmitCards = admitCards.filter((card) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      card.ApplicantName?.toLowerCase().includes(searchLower) ||
      card.contact?.toLowerCase().includes(searchLower) ||
      card.college?.toLowerCase().includes(searchLower) ||
      card.branch?.toLowerCase().includes(searchLower) ||
      card.year?.toString().includes(searchLower) ||
      card.venue?.toLowerCase().includes(searchLower) ||
      (card.examDate && card.examDate.toString().toLowerCase().includes(searchLower)) ||
      (card.examTime && card.examTime.toLowerCase().includes(searchLower)) ||
      (card.ReportingTime && card.ReportingTime.toLowerCase().includes(searchLower)) ||
      card.status?.toLowerCase().includes(searchLower) ||
      (card.RSAT && card.RSAT.toLowerCase().includes(searchLower))
    );
  });

  const stats = {
    totalStudents: students.length,
    cardsGenerated: admitCards.length,
    cardsIssued: admitCards.filter((c) => c.status === "issued").length,
    emailsSent: admitCards.filter((c) => c.emailSent).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold  text-indigo-800">Admit Card Management</h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">Manage student admit cards and examination details</p>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 rounded-lg border border-gray-300 bg-white shadow-sm">
                {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <button onClick={handleBulkEditClick} className="flex  border-indigo-300  rounded-lg items-center shadow-2xl gap-2 px-4 py-2 font-bold bg-gradient-to-r from-indigo-50 to-blue-50 00 text-indigo-800 border  text-sm cursor-pointer">
                <FiSettings className="w-4 h-4" /> Bulk Edit
              </button>
              <button onClick={() => { fetchAllStudents(); fetchAllAdmitCards(); }} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm">
                <FiRefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={() => setIsScannerOpen(true)} className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm">
                <FiCamera className="w-4 h-4" /> Scan
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="sm:hidden flex flex-col gap-2 w-full bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                <button onClick={handleBulkEditClick} className="flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <FiSettings className="w-4 h-4" /> Bulk Edit
                </button>
                <button onClick={() => { fetchAllStudents(); fetchAllAdmitCards(); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <FiRefreshCw className="w-4 h-4" /> Refresh Data
                </button>
                <button onClick={() => setIsScannerOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  <FiCamera className="w-4 h-4" /> Scan QR Code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Students", value: stats.totalStudents, icon: FiUsers, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Cards Generated", value: stats.cardsGenerated, icon: FiFileText, bg: "bg-green-50", color: "text-green-600" },
            { label: "Cards Issued", value: stats.cardsIssued, icon: FiCheckCircle, bg: "bg-purple-50", color: "text-purple-600" },
            { label: "Emails Sent", value: stats.emailsSent, icon: FiSend, bg: "bg-orange-50", color: "text-orange-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center">
                <div className={`p-2 ${s.bg} rounded-lg`}><s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} /></div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max sm:min-w-0">
              {[
                { id: "generate", label: "Generate Cards" },
                { id: "students", label: `Students`, count: students.length },
                { id: "admitCards", label: `Admit Cards`, count: admitCards.length },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-3 px-4 sm:px-6 text-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-1 sm:flex-none ${activeTab === tab.id ? "border-blue-500 text-blue-600 bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  {tab.count !== undefined && <span className={`px-2 py-1 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "generate" && (
              <CreateAdmitCard
                form={form}
                onFormChange={handleFormChange}
                handleBulkCreate={handleBulkCreate}
                studentsCount={students.length}
                saving={saving}
                message={message}
              />
            )}

            {activeTab === "students" && (
              <Students
                students={students}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                expandedStudent={expandedStudent}
                toggleStudentExpand={toggleStudentExpand}
              />
            )}

            {activeTab === "admitCards" && (
              <AdmitCardTab
                admitCards={admitCards}
                filteredAdmitCards={filteredAdmitCards}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                expandedAdmitCard={expandedAdmitCard}
                toggleAdmitCardExpand={toggleAdmitCardExpand}
                handleViewDetails={handleViewDetails}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditModal isOpen={isEditModalOpen} onClose={handleModalClose} admitCard={selectedAdmitCard} onUpdate={refreshAdmitCards} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={handleModalClose} admitCardId={selectedAdmitCard?._id} onDelete={refreshAdmitCards} />
      <BulkEditModal isOpen={isBulkEditModalOpen} onClose={handleBulkEditClose} onUpdate={refreshAdmitCards} />

      {/* Details modal */}
      {showDetailsModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Admit Card Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><FiX className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Student Information</h4>
                  <dl className="space-y-3">
                    <div><dt className="text-xs text-gray-500 font-medium">Full Name</dt><dd className="text-sm text-gray-900">{selectedCard.ApplicantName || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Contact</dt><dd className="text-sm text-gray-900">{selectedCard.contact || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Attendance</dt>
                      <dd className="text-sm">
                        {typeof selectedCard.present === "boolean" ? (selectedCard.present ? <span className="flex items-center text-green-600 gap-1"><FiCheckCircle className="w-4 h-4" />Present</span> : <span className="flex items-center text-red-500 gap-1"><FiXCircle className="w-4 h-4" />Absent</span>) : "N/A"}
                      </dd>
                    </div>
                    <div><dt className="text-xs text-gray-500 font-medium">College</dt><dd className="text-sm text-gray-900">{selectedCard.college || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Branch</dt><dd className="text-sm text-gray-900">{selectedCard.branch || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Year</dt><dd className="text-sm text-gray-900">{selectedCard.year || "N/A"}</dd></div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Examination Details</h4>
                  <dl className="space-y-3">
                    <div><dt className="text-xs text-gray-500 font-medium">Venue</dt><dd className="text-sm text-gray-900">{selectedCard.venue || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Exam Date</dt><dd className="text-sm text-gray-900">{formatDate(selectedCard.examDate)}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Exam Time</dt><dd className="text-sm text-gray-900">{selectedCard.examTime || "N/A"}</dd></div>
                    <div><dt className="text-xs text-gray-500 font-medium">Reporting Time</dt><dd className="text-sm text-gray-900">{selectedCard.ReportingTime || "N/A"}</dd></div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-800">Scan QR / Barcode</h3>
              <button onClick={() => { setIsScannerOpen(false); setScannerError(""); }} className="text-gray-600 hover:text-gray-800 p-1"><FiX className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="w-full h-64 sm:h-80 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                <UniversalScanner onScan={(decoded) => decoded && handleScanResult(decoded)} preferredCameraId={null} onError={handleScanError} />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Tip: Your browser will ask for camera permission. Use HTTPS or localhost.</p>
              {scannerError && <div className="text-xs text-red-600 mt-2 text-center">{scannerError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
