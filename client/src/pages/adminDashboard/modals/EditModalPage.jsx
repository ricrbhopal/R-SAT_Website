import React from "react";
import { AdminAPI } from "../../../config/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiHome,
  FiMapPin,
  FiSave,
  FiX,
  FiAward,
  FiRefreshCw,
} from "react-icons/fi";
import { FaIdCard } from "react-icons/fa";
export default function EditModalPage({ studentId, onClose, onUpdate }) {
  const [student, setStudent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [touched, setTouched] = React.useState({});

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
        console.error("Error fetching student:", err);
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
    const handleEscape = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  const handleInputChange = (field, value) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await AdminAPI.updateStudent(studentId, student);
      onUpdate?.(); // Notify parent about update
      onClose?.(); // Close modal on success
    } catch (err) {
      console.error("Error updating student:", err);
      setError(
        "Failed to update student details. Please check your input and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  if (!studentId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden transform transition-all duration-300"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-200 px-6 py-5 text-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-white rounded-full">
                <FiUser size={24} />
              </div>
              <div>
                <h2 id="edit-student-title" className="text-xl font-bold">
                  Edit Student Profile
                </h2>
                <p className="text-blue-600 text-sm">
                  Update student information and details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-2 hover:bg-white cursor-pointer rounded-lg transition-colors duration-200 disabled:opacity-50"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
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
                Unable to Load Student
              </h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiRefreshCw size={16} />
                  Retry
                </button>
              </div>
            </div>
          ) : student ? (
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <FiX size={14} />
                    </div>
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Form Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="rounded-xl p-5 ">
                    
                    <div className="space-y-4">
                      <FormField
                        icon={<FiUser />}
                        label="Full Name"
                        type="text"
                        value={student.fullName || ""}
                        onChange={(value) =>
                          handleInputChange("fullName", value)
                        }
                        onBlur={() => handleFieldBlur("fullName")}
                        touched={touched.fullName}
                        required
                        placeholder="Enter full name"
                      />
                      <FormField
                        icon={< FaIdCard />}
                        label="R-SAT ID"
                        type="text"
                        value={student.student_ID || ""}
                        onChange={(value) =>
                          handleInputChange("student_ID", value)
                        }
                        onBlur={() => handleFieldBlur("student_ID")}
                        touched={touched.student_ID}
                        required
                        placeholder="Enter R-SAT ID"
                      />
                      <FormField
                        icon={<FiMail />}
                        label="Email Address"
                        type="email"
                        value={student.mail_ID || ""}
                        onChange={(value) =>
                          handleInputChange("mail_ID", value)
                        }
                        onBlur={() => handleFieldBlur("mail_ID")}
                        touched={touched.mail_ID}
                        placeholder="Enter email address"
                      />
                      <FormField
                        icon={<FiPhone />}
                        label="Phone Number"
                        type="tel"
                        value={student.phoneNo || ""}
                        onChange={(value) =>
                          handleInputChange("phoneNo", value)
                        }
                        onBlur={() => handleFieldBlur("phoneNo")}
                        touched={touched.phoneNo}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-6">
                  <div className=" rounded-xl p-5 ">
                    
                    <div className="space-y-4">
                      <FormField
                        icon={<FiHome />}
                        label="College"
                        type="text"
                        value={student.college || ""}
                        onChange={(value) =>
                          handleInputChange("college", value)
                        }
                        onBlur={() => handleFieldBlur("college")}
                        touched={touched.college}
                        placeholder="Enter college name"
                      />
                      <FormField
                        icon={<FiMapPin />}
                        label="Branch"
                        type="text"
                        value={student.branch || ""}
                        onChange={(value) => handleInputChange("branch", value)}
                        onBlur={() => handleFieldBlur("branch")}
                        touched={touched.branch}
                        placeholder="Enter branch"
                      />
                      <FormField
                        icon={<FiAward />}
                        label="Year"
                        type="text"
                        value={student.year || ""}
                        onChange={(value) => handleInputChange("year", value)}
                        onBlur={() => handleFieldBlur("year")}
                        touched={touched.year}
                        placeholder="Enter academic year"
                      />
                      <FormField
                        icon={<FiAward />}
                        label="DOB"
                        type="date"
                        value={student.dob ? new Date(student.dob).toISOString().split('T')[0] : ""} // Format DOB to YYYY-MM-DD
                        onChange={(value) => handleInputChange("dob", value)}
                        onBlur={() => handleFieldBlur("dob")}
                        touched={touched.dob}
                        placeholder="Select date of birth"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-200 text-blue-600 rounded-lg hover:bg-blue-300 hover:text-white cursor-pointer transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Student Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The requested student information is not available.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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

// Reusable Form Field Component
function FormField({
  icon,
  label,
  type,
  value,
  onChange,
  onBlur,
  touched,
  required,
  placeholder,
}) {
  const hasError = touched && required && !value;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          hasError
            ? "border-red-300 focus:ring-red-200 bg-red-50"
            : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
        }`}
      />
      {hasError && (
        <p className="text-red-600 text-sm flex items-center gap-1">
          <span>⚠</span>
          This field is required
        </p>
      )}
    </div>
  );
}
