import React, { useEffect, useState } from "react";
import { AuthAPI } from "../../config/api.js";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiBook, 
  FiAward, 
  FiClock 
} from "react-icons/fi";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await AuthAPI.getStudentProfile();
        const payload = response?.data;
        setProfile(payload?.student || payload || {});
      } catch (err) {
        setError("Failed to fetch profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Profile
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const safeDate = (d) => {
    if (!d) return "-";
    const parsed = new Date(d);
    if (isNaN(parsed)) return d;
    return parsed.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-blue-200 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {/* Avatar - Responsive sizing */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-blue-600 text-base sm:text-lg md:text-xl font-bold">
                  {getInitials(profile.fullName)}
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 leading-tight">
                    {profile.fullName || "Unnamed Student"}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Personal Information */}
              <div>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Student ID
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                      {profile.student_ID || "—"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiMail className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Email Address
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg break-all">
                      {profile.mail_ID || "-"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                      {profile.phoneNo || "-"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiCalendar className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Date of Birth
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                      {safeDate(profile.dob)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiBook className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        College
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg break-words">
                      {profile.college || "-"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiAward className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Branch
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                      {profile.branch || "-"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiClock className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-500">
                        Academic Year
                      </label>
                    </div>
                    <p className="text-gray-900 font-medium text-base sm:text-lg">
                      Year {profile.year || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;