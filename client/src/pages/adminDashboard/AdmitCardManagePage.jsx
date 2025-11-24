import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../config/api";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiDownload,
  FiMail,
  FiUser,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiFileText,
  FiSend,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiSettings,
  FiCamera,
  FiXCircle,
} from "react-icons/fi";
import EditModal from "./modals/AdmitCard/EditModal.jsx";
import DeleteModal from "./modals/AdmitCard/DeleteModels.jsx";
import BulkEditModal from "./modals/AdmitCard/BulkEditModals.jsx";

// Universal scanner (html5-qrcode based)
import UniversalScanner from "./modals/AdmitCard/scancer.jsx";

export default function AdmitCardManagePage() {
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmitCard, setSelectedAdmitCard] = useState(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // NEW: scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");

  useEffect(() => {
    fetchAllStudents();
    fetchAllAdmitCards();
  }, []);

  const fetchAllStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAPI.getAllStudents();
      console.log("Students API Response:", res);

      if (res && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        console.error("Unexpected response format:", res);
        setError("Unexpected response format from server.");
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError(
        "Failed to load students. Please check the API or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAdmitCards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminAPI.getAllAdmitCards();
      console.log("Admit Cards API Response:", res);

      if (res && res.data && Array.isArray(res.data.data)) {
        const formattedAdmitCards = res.data.data.map((card) => ({
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
          present: typeof card.present === 'boolean' ? card.present : false,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        }));
        setAdmitCards(formattedAdmitCards);
      } else {
        console.error("Unexpected response format:", res);
        setError("Unexpected response format from server.");
      }
    } catch (err) {
      console.error("Error fetching admit cards:", err);
      setError(
        "Failed to load admit cards. Please check the API or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkCreate = async () => {
    if (
      !form.venue ||
      !form.examDate ||
      !form.examTime ||
      !form.ReportingTime
    ) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await AdminAPI.bulkCreateAdmitCards(form);
      setMessage({
        type: "success",
        text: "Admit cards created successfully for all students!",
      });
      await fetchAllAdmitCards();
    } catch (err) {
      console.error("Failed to create admit cards", err);
      setMessage({
        type: "error",
        text: "Failed to create admit cards. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = (card) => {
    setSelectedCard(card);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const filteredAdmitCards = admitCards.filter((card) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      card.ApplicantName?.toLowerCase().includes(searchLower) ||
      card.contact?.toLowerCase().includes(searchLower) ||
      card.college?.toLowerCase().includes(searchLower) ||
      card.branch?.toLowerCase().includes(searchLower) ||
      card.year?.toString().includes(searchLower) ||
      card.venue?.toLowerCase().includes(searchLower) ||
      (card.examDate &&
        card.examDate.toString().toLowerCase().includes(searchLower)) ||
      (card.examTime && card.examTime.toLowerCase().includes(searchLower)) ||
      (card.ReportingTime &&
        card.ReportingTime.toLowerCase().includes(searchLower)) ||
      card.status?.toLowerCase().includes(searchLower) ||
      (card.RSAT && card.RSAT.toLowerCase().includes(searchLower))
    );
  });

  const stats = {
    totalStudents: students.length,
    cardsGenerated: admitCards.length,
    cardsIssued: admitCards.filter((card) => card.status === "issued").length,
    emailsSent: admitCards.filter((card) => card.emailSent).length,
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

  const handleBulkEditClick = () => {
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditClose = () => {
    setIsBulkEditModalOpen(false);
  };

  const refreshAdmitCards = async () => {
    await fetchAllAdmitCards();
  };

  // NEW: handle a successful scan
  const handleScanResult = (scannedText) => {
    if (!scannedText) return;
    try {
      const trimmed = scannedText.trim();
      // Only handle URLs that match the expected attendance scan format
      const expectedBase =
        "https://rsat.ricr.in/api/admit-cards/scan-attendance/";
      if (trimmed.startsWith(expectedBase)) {
        // Mark attendance using fetch with official scanner header
        fetch(trimmed, {
          method: "GET",
          headers: {
            "x-official-scanner": "true",
          },
        })
          .then(async (res) => {
            const data = await res.json();
            if (res.status === 403) {
              setScannerError(
                "Attendance can only be marked using the official scanner. Unauthorized scan detected."
              );
              alert(
                "Attendance can only be marked using the official scanner. Unauthorized scan detected."
              );
            } else if (data.message) {
              alert(data.message);
            } else {
              alert("Attendance marked successfully.");
            }
          })
          .catch((err) => {
            setScannerError("Error marking attendance. Please try again.");
            alert("Error marking attendance. Please try again.");
          })
          .finally(() => {
            setIsScannerOpen(false);
          });
      } else {
        setSearchTerm(trimmed);
        setActiveTab("admitCards");
        const matched = admitCards.find(
          (c) =>
            (c.RSAT &&
              c.RSAT.toString().toLowerCase() === trimmed.toLowerCase()) ||
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
    setScannerError(
      "Camera/permission error. Please allow camera access or try another device."
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admit Card Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage student admit cards and examination details
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleBulkEditClick}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FiSettings className="w-4 h-4" />
                Bulk Edit
              </button>
              <button
                onClick={() => {
                  fetchAllStudents();
                  fetchAllAdmitCards();
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {/* Button opens UniversalScanner modal */}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FiCamera className="w-4 h-4" />
                Scan Admit Card
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiFileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Cards Generated
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.cardsGenerated}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Cards Issued
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.cardsIssued}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiSend className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.emailsSent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("generate")}
                className={`py-3 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "generate"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Generate Cards
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-3 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "students"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab("admitCards")}
                className={`py-3 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "admitCards"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Admit Cards ({admitCards.length})
              </button>
            </nav>
          </div>

          {/* Tab Content (unchanged) */}
          <div className="p-6">
            {/* Generate Cards Tab */}
            {activeTab === "generate" && (
              <div className="space-y-6">
                {/* ... same as before ... */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Generate Admit Cards
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Create admit cards for all registered students with exam
                    details.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiMapPin className="inline w-4 h-4 mr-1 text-gray-400" />
                      Examination Venue *
                    </label>
                    <input
                      name="venue"
                      value={form.venue}
                      onChange={handleFormChange}
                      placeholder="Enter examination venue"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="inline w-4 h-4 mr-1 text-gray-400" />
                      Exam Date *
                    </label>
                    <input
                      name="examDate"
                      value={form.examDate}
                      onChange={handleFormChange}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiClock className="inline w-4 h-4 mr-1 text-gray-400" />
                      Exam Time *
                    </label>
                    <input
                      name="examTime"
                      value={form.examTime}
                      onChange={handleFormChange}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiClock className="inline w-4 h-4 mr-1 text-gray-400" />
                      Reporting Time *
                    </label>
                    <input
                      name="ReportingTime"
                      value={form.ReportingTime}
                      onChange={handleFormChange}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="not_issued">Not Issued</option>
                      <option value="issued">Issued</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800">
                        This will generate admit cards for all{" "}
                        <strong>{students.length}</strong> registered students.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkCreate}
                    disabled={saving}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                      saving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      `Generate ${students.length} Admit Cards`
                    )}
                  </button>
                </div>

                {message.text && (
                  <div
                    className={`p-3 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center">
                      {message.type === "success" ? (
                        <FiCheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <FiAlertCircle className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-sm">{message.text}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div className="space-y-4">
                {/* ... same as before ... */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Registered Students
                  </h2>
                  <div className="mt-2 sm:mt-0">
                    <div className="relative">
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : students.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              College
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Branch
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Year
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.student_ID}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                                  {student.fullName}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.phoneNo}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.college}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.branch}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {student.year}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      No students found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No students are currently registered.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admit Cards Tab */}
            {activeTab === "admitCards" && (
              <div className="space-y-4">
                {/* ... same as before ... */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Admit Cards
                  </h2>
                  <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search admit cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAdmitCards.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College & Branch</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Details</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAdmitCards.map((card) => (
                            <tr className="hover:bg-gray-50" key={card._id}>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{card.ApplicantName}</div>
                                  <div className="text-sm text-gray-500">{card.contact}</div>
                                  <div className="text-xs text-gray-400">Year: {card.year}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">{card.college}</div>
                                <div className="text-sm text-gray-500">{card.branch}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center gap-1">
                                    <FiCalendar className="w-4 h-4" />
                                    {formatDate(card.examDate)}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FiClock className="w-4 h-4" />
                                      {card.examTime}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">{card.venue}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {card.present ? (
                                  <span className="flex items-center text-green-600 gap-1">
                                    <FiCheckCircle className="w-5 h-5" />
                                    <span>Present</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-500 gap-1">
                                    <FiXCircle className="w-5 h-5" />
                                    <span>Absent</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleViewDetails(card)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="View Details"
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditClick(card)}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(card)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      No admit cards found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {admitCards.length === 0
                        ? "Generate admit cards using the Generate Cards tab."
                        : "No admit cards match your search criteria."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        admitCard={selectedAdmitCard}
        onUpdate={refreshAdmitCards}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleModalClose}
        admitCardId={selectedAdmitCard?._id}
        onDelete={refreshAdmitCards}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={handleBulkEditClose}
        onUpdate={refreshAdmitCards}
      />

      {/* Details Modal */}
      {showDetailsModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Admit Card Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                    Student Information
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Full Name
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.ApplicantName || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Contact
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.contact || "N/A"}
                      </dd>
                        <dd className="text-sm text-gray-900">
                        {typeof selectedCard.present === 'boolean' ? (
                          selectedCard.present ? (
                            <span className="flex items-center text-green-600 gap-1">
                              <FiCheckCircle className="w-4 h-4" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="flex items-center text-red-500 gap-1">
                              <FiXCircle className="w-4 h-4" />
                              <span>Absent</span>
                            </span>
                          )
                        ) : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        College
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.college || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Branch
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.branch || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Year
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.year || "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                    Examination Details
                  </h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Venue
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.venue || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Exam Date
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formatDate(selectedCard.examDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Exam Time
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.examTime || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray- gray-500 font-medium">
                        Reporting Time
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {selectedCard.ReportingTime || "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal using UniversalScanner */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="text-sm font-semibold text-gray-800">
                Scan QR / Barcode
              </h3>
              <button
                onClick={() => {
                  setIsScannerOpen(false);
                  setScannerError("");
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="w-full h-80 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {/* UniversalScanner is html5-qrcode based and handles start/stop itself */}
                <UniversalScanner
                  onScan={(decodedText) => {
                    if (decodedText) handleScanResult(decodedText);
                  }}
                  preferredCameraId={null}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Your browser will ask for camera permission. If it does
                not, check your browser settings and make sure you are using
                HTTPS or localhost. If camera doesn't open, try using a secure
                (https) site or open on mobile.
              </p>
              {scannerError && (
                <div className="text-xs text-red-600 mt-2">{scannerError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
