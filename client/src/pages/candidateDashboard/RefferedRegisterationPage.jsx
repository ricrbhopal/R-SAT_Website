// src/pages/ReferredRegisterationPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReferralAPI } from "../../config/api.js";

const useQuery = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

function updateFormField(setForm, key, value) {
  setForm((s) => ({ ...s, [key]: value }));
}

export default function ReferredRegisterationPage() {
  const query = useQuery();

  // referral code param name may be ref or code etc.
  const refParam =
    query.get("ref") ||
    query.get("code") ||
    query.get("referral") ||
    "";

  // explicit studentId param added by backend when generating link
  const studentIdParam =
    query.get("studentId") ||
    query.get("student_id") ||
    query.get("sid") ||
    "";

  const [referrer, setReferrer] = useState(null);
  const [loadingReferrer, setLoadingReferrer] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    referredEmail: "",
    referredPhone: "",
    collegeName: "",
    branch: "",
    year: "",
    dob: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReferrer = async () => {
      try {
        setLoadingReferrer(true);

        if (!refParam) {
          setReferrer(null);
          toast.error("Invalid or missing referral link.");
          return;
        }

        // If a studentId param is present, use it immediately for fast prefill/display
        if (studentIdParam) {
          // show immediate minimal info
          setReferrer({
            student_ID: studentIdParam,
            fullName: "Referrer",
            userId: null,
          });

          // Optionally fetch friendly name and other details using referral code
          try {
            const res = await ReferralAPI.getReferralInfo(refParam);
            const data = res?.data || {};
            setReferrer({
              student_ID: studentIdParam,
              fullName: data?.referrer?.name || data?.referrer?.fullName || "Referrer",
              userId: data?.referrer?.userId || data?.referrer?.id || null,
            });
          } catch (err) {
            // ignore — we already have studentId param; log for debug
            console.warn("Could not fetch referrer friendly name:", err);
          }
          return;
        }

        // No explicit studentId in URL; fetch using referral code
        const res = await ReferralAPI.getReferralInfo(refParam);
        const data = res?.data || {};

        setReferrer({
          id: data?.referrer?.id || null,
          student_ID: data?.referrer?.student_ID || data?.referrer?.studentId || null,
          fullName: data?.referrer?.name || data?.referrer?.fullName || "Referrer",
          userId: data?.referrer?.userId || data?.referrer?.id || null,
        });
      } catch (err) {
        console.error("Error fetching referrer data:", err);
        setReferrer({ fullName: "Unknown Referrer", student_ID: studentIdParam || null });
      } finally {
        setLoadingReferrer(false);
      }
    };

    fetchReferrer();
  }, [refParam, studentIdParam]);

  const validateForm = () => {
    if (!form.fullName.trim()) return "Please enter full name.";
    if (!form.referredEmail.trim()) return "Please enter email.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.referredEmail.trim())) return "Please enter a valid email.";
    if (!form.referredPhone.trim()) return "Please enter phone number.";
    if (!/^[0-9]{6,15}$/.test(form.referredPhone.trim()))
      return "Please enter a valid phone number (6-15 digits).";
    if (!form.collegeName.trim()) return "Please enter college name.";
    if (!form.branch.trim()) return "Please enter branch.";
    if (!form.year.trim()) return "Please select academic year.";
    if (!form.dob.trim()) return "Please enter date of birth.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!refParam) {
      toast.error("Referral code is missing. Please check the link.");
      return;
    }

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        fullName: form.fullName.trim(),
        phoneNo: form.referredPhone.trim(),
        mail_ID: form.referredEmail.trim(),
        college: form.collegeName.trim(),
        branch: form.branch.trim(),
        year: form.year.trim(),
        dob: form.dob.trim(),
      };

      const res = await ReferralAPI.registerWithReferral(payload, refParam);
      toast.success(res?.data?.message || "Registration successful!");

      // reset form on success
      setForm({
        fullName: "",
        referredEmail: "",
        referredPhone: "",
        collegeName: "",
        branch: "",
        year: "",
        dob: "",
      });
    } catch (err) {
      console.error("Error during registration:", err);
      toast.error(err?.response?.data?.message || "Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8 mt-18">
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="max-w-2xl mx-auto">


        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-10">
          {/* Referral Info Banner */}
          <div className="bg-blue-200   px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {loadingReferrer ? (
                    <div className="w-10 h-10 bg-blue-200 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {referrer?.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {loadingReferrer ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-blue-400 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-blue-400 rounded w-24 animate-pulse"></div>
                    </div>
                  ) : referrer ? (
                    <>
                      <p className="text-blue-600 font-bold">
                        Referred by: {referrer.fullName || "Referrer"}
                      </p>
                    
                    </>
                  ) : (
                    <p className="text-red-200 font-medium">Invalid referral link</p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 sm:mt-0">
                <div className="bg-white bg-opacity-30 px-3 py-1 rounded-full">
                  <span className="text-blue-600  text-sm font-bold">
                        {referrer.student_ID && `Student ID: ${referrer.student_ID}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateFormField(setForm, "fullName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.referredEmail}
                    onChange={(e) => updateFormField(setForm, "referredEmail", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={form.referredPhone}
                    onChange={(e) => updateFormField(setForm, "referredPhone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* College Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    College Name *
                  </label>
                  <input
                    type="text"
                    value={form.collegeName}
                    onChange={(e) => updateFormField(setForm, "collegeName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your college name"
                    required
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch *
                  </label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => updateFormField(setForm, "branch", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => updateFormField(setForm, "year", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Passed Out">Passed Out</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => updateFormField(setForm, "dob", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !referrer}
                  className="w-full bg-blue-200 text-blue-600 cursor-pointer py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-500  hover:text-white focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Registration...</span>
                    </div>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>

              {/* Required Fields Note */}
              <p className="text-center text-sm text-gray-500">
                * Required fields
              </p>
            </form>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team at support@example.com
          </p>
        </div>
      </div>
    </div>
  );
}