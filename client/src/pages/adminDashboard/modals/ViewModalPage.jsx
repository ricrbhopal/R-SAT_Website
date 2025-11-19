import React from "react";
import { AdminAPI } from "../../../config/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiMapPin,
  FiClock,
  FiEdit2,
  FiPrinter,
  FiX,
  FiAward,
  FiHome,
} from "react-icons/fi";

export default function ViewModalPage({ studentId, onClose }) {
  const [student, setStudent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    const fetchStudent = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await AdminAPI.getStudentById(studentId);
        if (!mounted) return;
        setStudent(response.data ?? null);
      } catch (err) {
        console.error("getStudentById error:", err);
        if (!mounted) return;
        setError("Failed to fetch student details. Please try again later.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    } else {
      setStudent(null);
      setLoading(false);
      setError("");
    }

    return () => {
      mounted = false;
    };
  }, [studentId]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString.split("T")[0];
    }
  };

  if (!studentId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-details-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-transform duration-300 scale-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-gray-600">Loading student details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Details
              </h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : student ? (
            <div className="">
              {/* Header */}
              <div className="bg-blue-200  mb-5 px-6 py-4 text-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-5 bg-white rounded-[100] rounded-full flex items-center justify-center">
                      <FiUser size={24} />
                    </div>
                    <div>
                      <h2
                        id="student-details-title"
                        className="text-xl font-bold  mb-1"
                      >
                        {student.fullName || "Unknown Student"}
                      </h2>
                      {student.student_ID && (
                        <span className="font-medium text-blue-700 text-center">
                          {student.student_ID}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white rounded-lg transition-colors duration-200 cursor-pointer"
                    aria-label="Close"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto max-w-4xl px-4 pb-6">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <InfoRow
                        icon={<FiMail />}
                        label="Email"
                        value={student.mail_ID}
                      />
                      <InfoRow
                        icon={<FiPhone />}
                        label="Phone"
                        value={student.phoneNo}
                      />
                      <InfoRow
                        icon={<FiCalendar />}
                        label="Date of Birth"
                        value={formatDate(student.dob)}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiBook className="text-purple-600" />
                      Academic Details
                    </h3>
                    <div className="space-y-3">
                      <InfoRow
                        icon={<FiHome />}
                        label="College"
                        value={student.college}
                      />
                      <InfoRow
                        icon={<FiMapPin />}
                        label="Branch"
                        value={student.branch}
                      />
                      <InfoRow
                        icon={<FiAward />}
                        label="Year"
                        value={student.year}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 p-5">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg cursor-pointer border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <FiPrinter size={16} />
                  Print
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Student Data
              </h3>
              <p className="text-gray-600 mb-6">
                The requested student information is not available.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Info Row Component
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
        <div className="text-gray-900 font-semibold">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
      </div>
    </div>
  );
}
