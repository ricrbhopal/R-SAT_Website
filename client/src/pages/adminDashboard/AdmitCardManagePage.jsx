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
} from "react-icons/fi";

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

  const handleDownloadCard = (card) => {
    console.log("Downloading admit card for:", card.ApplicantName);
    // Implement download functionality
  };

  const handleSendEmail = (card) => {
    console.log("Sending email for:", card.ApplicantName);
    // Implement email functionality
  };

  const handleBulkEmail = () => {
    console.log("Sending bulk emails for all admit cards");
    // Implement bulk email functionality
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      issued: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Issued",
        icon: FiCheckCircle,
      },
      not_issued: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Not Issued",
        icon: FiAlertCircle,
      },
      sent: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Email Sent",
        icon: FiSend,
      },
    };

    const config = statusConfig[status] || statusConfig.not_issued;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const filteredAdmitCards = admitCards.filter((card) => {
    const matchesSearch =
      card.ApplicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.branch?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalStudents: students.length,
    cardsGenerated: admitCards.length,
    cardsIssued: admitCards.filter((card) => card.status === "issued").length,
    emailsSent: admitCards.filter((card) => card.emailSent).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admit Card Management
              </h1>
              <p className="text-gray-600 mt-2">
                Generate and manage examination admit cards efficiently
              </p>
            </div>
            <button
              onClick={() => {
                fetchAllStudents();
                fetchAllAdmitCards();
              }}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiFileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Cards Generated
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.cardsGenerated}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(
                    (stats.cardsGenerated / stats.totalStudents) * 100
                  )}
                  % of students
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiSend className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.emailsSent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("generate")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "generate"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Generate Cards
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "students"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab("admitCards")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "admitCards"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Admit Cards ({admitCards.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Generate Cards Tab */}
            {activeTab === "generate" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Generate Admit Cards in Bulk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="not_issued">Not Issued</option>
                      <option value="issued">Issued</option>
                    </select>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex">
                    <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800">
                        This will generate admit cards for all{" "}
                        <strong>{students.length}</strong> registered students.
                        Each card will include the student's details along with
                        the examination information specified above.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBulkCreate}
                    disabled={saving}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-all ${
                      saving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                        Generating Admit Cards...
                      </span>
                    ) : (
                      `Generate ${students.length} Admit Cards`
                    )}
                  </button>

                  {admitCards.length > 0 && (
                    <button
                      onClick={handleBulkEmail}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <FiMail className="w-4 h-4 inline mr-2" />
                      Send Bulk Email
                    </button>
                  )}
                </div>

                {message.text && (
                  <div
                    className={`mt-4 p-4 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center">
                      {message.type === "success" ? (
                        <FiCheckCircle className="w-5 h-5 mr-3" />
                      ) : (
                        <FiAlertCircle className="w-5 h-5 mr-3" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Registered Students
                  </h2>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <div className="relative">
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : students.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            College
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Branch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => {
                          const hasAdmitCard = admitCards.some(
                            (card) => card.studentId === student._id
                          );
                          return (
                            <tr
                              key={student._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {student.student_ID}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                                  {student.fullName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.phoneNo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.college}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.branch}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {student.year}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No students found
                    </h3>
                    <p className="mt-2 text-gray-500">
                      No students are currently registered in the system.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admit Cards Tab */}
            {activeTab === "admitCards" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Generated Admit Cards
                  </h2>
                  <div className="mt-4 sm:mt-0 flex items-center gap-4">
                    <div className="relative">
                      <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search admit cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="issued">Issued</option>
                      <option value="not_issued">Not Issued</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAdmitCards.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            College & Branch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exam Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAdmitCards.map((card) => (
                          <tr
                            key={card._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {card.ApplicantName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {card.contact}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Year: {card.year}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {card.college}
                              </div>
                              <div className="text-sm text-gray-500">
                                {card.branch}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center gap-1">
                                  <FiCalendar className="w-4 h-4" />
                                  {formatDate(card.examDate)}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  <div className="flex items-center gap-1">
                                    <FiClock className="w-4 h-4" />
                                    {card.examTime} (Report:{" "}
                                    {card.ReportingTime})
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {card.venue}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewDetails(card)}
                                  className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No admit cards found
                    </h3>
                    <p className="mt-2 text-gray-500">
                      {admitCards.length === 0
                        ? "Generate admit cards using the 'Generate Cards' tab above."
                        : "No admit cards match your search criteria."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admit Card Details Modal */}
      {showDetailsModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Admit Card Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
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
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.ApplicantName === "string"
                          ? selectedCard.ApplicantName
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Contact Information
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.contact === "string"
                          ? selectedCard.contact
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        College
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.college === "string"
                          ? selectedCard.college
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Branch
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.branch === "string"
                          ? selectedCard.branch
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Academic Year
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.year === "string" ||
                        typeof selectedCard.year === "number"
                          ? selectedCard.year
                          : "N/A"}
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
                        Examination Venue
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.venue === "string"
                          ? selectedCard.venue
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Examination Date
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedCard.examDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Examination Time
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.examTime === "string"
                          ? selectedCard.examTime
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Reporting Time
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {typeof selectedCard.ReportingTime === "string"
                          ? selectedCard.ReportingTime
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 font-medium">
                        Current Status
                      </dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {getStatusBadge(selectedCard.status)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                  Additional Information
                </h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      Admit Card ID
                    </dt>
                    <dd className="text-sm text-gray-900 font-mono mt-1">
                      {typeof selectedCard._id === "string"
                        ? selectedCard._id
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      Student ID
                    </dt>
                    <dd className="text-sm text-gray-900 font-mono mt-1">
                      {typeof selectedCard.studentId === "string"
                        ? selectedCard.studentId
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      Email Notification
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {selectedCard.emailSent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <FiCheckCircle className="w-3 h-3" />
                          Email Sent Successfully
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          <FiAlertCircle className="w-3 h-3" />
                          Email Pending
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      RSAT Score
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {typeof selectedCard.RSAT === "string" ||
                      typeof selectedCard.RSAT === "number"
                        ? selectedCard.RSAT
                        : "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleSendEmail(selectedCard)}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium rounded-lg transition-colors"
                >
                  Send Email
                </button>
                <button
                  onClick={() => handleDownloadCard(selectedCard)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-lg transition-colors"
                >
                  Download Admit Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
