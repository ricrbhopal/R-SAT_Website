// client/src/pages/RefferedRegisterationPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReferralAPI } from "../../config/api.js";
import { AdminAPI } from "../../config/api.js";

/**
 * RefferedRegisterationPage
 * - Aggressive console logging for debugging
 * - Enables registration button when URL contains ref/code/userId (so same link can be shared multiple times)
 * - Shows a debug panel with parsed params and referrer state
 */

const useQuery = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

function updateFormField(setForm, key, value) {
  setForm((s) => ({ ...s, [key]: value }));
}

export default function RefferedRegisterationPage() {
  const query = useQuery();

  // accept multiple param names
  const rawRef = query.get("ref") || query.get("code") || query.get("referral") || query.get("userId") || "";
  const refParam = rawRef ? decodeURIComponent(String(rawRef).trim()) : "";
  const studentIdParam = query.get("studentId") || query.get("sid") || "";



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
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  const resendTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function fetchReferrer() {
      console.group("[fetchReferrer] start");
      console.log("Trying to fetch referrer info for:", { refParam, studentIdParam });

      try {
        setLoadingReferrer(true);

        if (!refParam && !studentIdParam) {
          console.warn("[fetchReferrer] no refParam or studentIdParam in URL");
          setReferrer(null);
          toast.error("Referral code missing from URL.");
          return;
        }

        const codeToTry = refParam || studentIdParam;
        // 1) Try referrals/info/:code
        try {
          console.log("[fetchReferrer] calling ReferralAPI.getReferralInfo with:", codeToTry);
          const res = await ReferralAPI.getReferralInfo(codeToTry);
          console.log("[fetchReferrer] getReferralInfo response:", res?.status, res?.data);
          const data = res?.data || {};
          if (data?.referrer) {
            const rr = {
              id: data.referrer.id || null,
              userId: data.referrer.userId || data.referrer.id || null,
              student_ID: data.referrer.student_ID || null,
              fullName: data.referrer.name || data.referrer.fullName || "Referrer",
            };
            console.log("[fetchReferrer] parsed referrer:", rr);
            setReferrer(rr);
            return;
          } else {
            console.warn("[fetchReferrer] referrals/info returned no referrer object", res?.data);
          }
        } catch (err) {
          console.warn("[fetchReferrer] ReferralAPI.getReferralInfo failed:", err?.response?.status, err?.response?.data || err.message || err);
        }

        // 2) If the code looks like a Mongo ObjectId, try to fetch student info
        const looksLikeObjectId = /^[0-9a-fA-F]{24}$/.test(codeToTry);
        if (looksLikeObjectId) {
          try {
            const studentRes = await AdminAPI.getStudentById(codeToTry);
            const student = studentRes?.data;
            if (student) {
              const fallbackRef = {
                id: student._id || codeToTry,
                userId: student._id || codeToTry,
                student_ID: student.student_ID || null,
                fullName: student.fullName || "Referrer",
              };
              setReferrer(fallbackRef);
              toast.info("Referral link detected. Registered by " + (student.fullName || "Referrer"));
              return;
            }
          } catch (studentErr) {
            // fallback to synthetic minimal referrer
            const synthetic = {
              id: codeToTry,
              userId: codeToTry,
              student_ID: null,
              fullName: "Referrer (unverified)",
            };
            setReferrer(synthetic);
            toast.info("Referral link detected. Referrer details not verified but you can continue.");
            return;
          }
        }

        // 3) Fallback: not found
        console.warn("[fetchReferrer] referral not found for code:", codeToTry);
        setReferrer(null);
        toast.error("Referral not found or expired.");
      } finally {
        if (mountedRef.current) setLoadingReferrer(false);
        console.groupEnd();
      }
    }

    fetchReferrer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam, studentIdParam]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
      return;
    }
    if (!resendTimerRef.current) {
      resendTimerRef.current = setInterval(() => {
        setResendSeconds((s) => {
          if (s <= 1) {
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  }, [resendSeconds]);

  const validateForm = () => {
    if (!form.fullName.trim()) return "Please enter full name.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.referredEmail.trim()) return "Please enter email.";
    if (!emailRe.test(form.referredEmail.trim())) return "Please enter a valid email.";
    if (!form.referredPhone.trim()) return "Please enter phone number.";
    if (!/^[0-9]{6,15}$/.test(form.referredPhone.trim())) return "Please enter a valid phone number (6-15 digits).";
    if (!form.collegeName.trim()) return "Please enter college name.";
    if (!form.branch.trim()) return "Please enter branch.";
    if (!form.year.trim()) return "Please select academic year.";
    if (!form.dob.trim()) return "Please enter date of birth.";
    if (!otpSent) return "Please verify your phone by sending OTP first.";
    if (!phoneOTP.trim()) return "Please enter the OTP sent to your phone.";
    return null;
  };

  const handleSendOTP = async () => {
    console.group("[handleSendOTP]");
    setOtpError("");
    const phone = String(form.referredPhone || "").trim();
    console.log("Sending OTP to:", phone, "refParam:", refParam || undefined);

    if (!/^[0-9]{6,15}$/.test(phone)) {
      console.warn("[handleSendOTP] invalid phone:", phone);
      const msg = "Enter a valid phone number before requesting OTP.";
      setOtpError(msg);
      toast.error(msg);
      console.groupEnd();
      return;
    }
    if (otpLoading) {
      console.log("[handleSendOTP] already loading");
      console.groupEnd();
      return;
    }
    setOtpLoading(true);

    try {
      const body = { phoneNo: phone };
      if (refParam) body.ref = refParam;
      console.log("[handleSendOTP] request body:", body);
      const res = await ReferralAPI.sendReferralOTP(body);
      console.log("[handleSendOTP] response:", res?.status, res?.data);
      if (!mountedRef.current) {
        console.warn("[handleSendOTP] component unmounted after OTP send");
        return;
      }
      setOtpSent(true);
      setResendSeconds(60);
      toast.success("OTP sent to your phone.");
    } catch (err) {
      console.error("[handleSendOTP] error:", err?.response?.status, err?.response?.data || err.message || err);
      const msg = err?.response?.data?.message || "Failed to send OTP. Try again later.";
      setOtpError(msg);
      toast.error(msg);
    } finally {
      if (mountedRef.current) setOtpLoading(false);
      console.groupEnd();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.group("[handleSubmit] start");
    console.log("refParam:", refParam, "studentIdParam:", studentIdParam, "referrer:", referrer);

    if (!refParam && !studentIdParam) {
      console.warn("[handleSubmit] no referral param - blocking submit");
      toast.error("Referral code is missing. Please check the link.");
      console.groupEnd();
      return;
    }

    const errorMsg = validateForm();
    if (errorMsg) {
      console.warn("[handleSubmit] validation failed:", errorMsg);
      toast.error(errorMsg);
      console.groupEnd();
      return;
    }

    if (submitting) {
      console.log("[handleSubmit] already submitting");
      console.groupEnd();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phoneNo: form.referredPhone.trim(),
        mail_ID: form.referredEmail.trim(),
        college: form.collegeName.trim(),
        branch: form.branch.trim(),
        year: form.year.trim(),
        dob: form.dob.trim(),
        phoneOTP: phoneOTP.trim(),
      };

      console.log("[handleSubmit] payload:", payload, "sending to registerWithReferral with ref:", refParam || studentIdParam);
      const res = await ReferralAPI.registerWithReferral(payload, refParam || studentIdParam);
      console.log("[handleSubmit] registerWithReferral response:", res?.status, res?.data);
      toast.success(res?.data?.message || "Registration successful!");

      const token = res?.data?.token;
      if (token) {
        try {
          sessionStorage.setItem("token", token);
          console.log("[handleSubmit] stored token in sessionStorage");
        } catch (err) {
          console.warn("[handleSubmit] sessionStorage set error:", err);
        }
      }

      // reset
      setForm({ fullName: "", referredEmail: "", referredPhone: "", collegeName: "", branch: "", year: "", dob: "" });
      setPhoneOTP("");
      setOtpSent(false);
      setResendSeconds(0);
    } catch (err) {
      console.error("[handleSubmit] error:", err?.response?.status, err?.response?.data || err.message || err);
      const msg = err?.response?.data?.message || "Failed to register. Please try again.";
      toast.error(msg);
    } finally {
      if (mountedRef.current) setSubmitting(false);
      console.groupEnd();
    }
  };

  // ENABLE button if we have any reference param (user wants single shareable link)
  const isRegistrationAllowed = Boolean(refParam || studentIdParam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8 mt-18">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="light" />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-10">
          <div className="bg-blue-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {loadingReferrer ? (
                    <div className="w-10 h-10 bg-blue-200 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">{referrer?.fullName ? String(referrer.fullName).charAt(0) : "?"}</span>
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
                      <p className="text-blue-600 font-bold">Referred by: {referrer?.fullName || "Referrer"}</p>
                      <p className="text-sm text-gray-700">You are registering using {referrer?.fullName}'s referral link.</p>
                    </>
                  ) : (
                    <p className="text-red-500 font-medium">Referral not verified — proceed carefully.</p>
                  )}
                </div>
              </div>
              <div className="mt-3 sm:mt-0">
                <div className="bg-white bg-opacity-30 px-3 py-1 rounded-full">
                  <span className="text-blue-600 text-sm font-bold">{referrer?.student_ID ? `Student ID: ${referrer.student_ID}` : ""}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input type="text" value={form.fullName} onChange={(e) => updateFormField(setForm, "fullName", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="Enter your full name" required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input type="email" value={form.referredEmail} onChange={(e) => updateFormField(setForm, "referredEmail", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="your.email@example.com" required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <div className="flex gap-2">
                    <input type="tel" value={form.referredPhone} onChange={(e) => updateFormField(setForm, "referredPhone", e.target.value.replace(/\D/g, ""))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="Enter your phone number" required />
                    <button type="button" onClick={handleSendOTP} disabled={otpLoading || resendSeconds > 0 || !/^[0-9]{6,15}$/.test(String(form.referredPhone || "").trim())} className={`px-4 py-3 rounded-lg font-semibold text-sm ${otpLoading || resendSeconds > 0 ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
                      {otpLoading ? "Sending..." : resendSeconds > 0 ? `Resend (${resendSeconds}s)` : otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>
                  {otpError && <p className="text-sm text-red-500 mt-1">{otpError}</p>}
                </div>

                {otpSent && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP *</label>
                    <input type="text" value={phoneOTP} onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, ""))} className="w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="6-digit OTP" maxLength={6} required />
                    <p className="text-xs text-gray-500 mt-2">Didn't receive OTP? Try again after the countdown or contact support.</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">College Name *</label>
                  <input type="text" value={form.collegeName} onChange={(e) => updateFormField(setForm, "collegeName", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" placeholder="Enter your college name" required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch *</label>
                  <select value={form.branch} onChange={(e) => updateFormField(setForm, "branch", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white" required>
                    <option value="">Select Branch</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year *</label>
                  <select value={form.year} onChange={(e) => updateFormField(setForm, "year", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white" required>
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Passed Out">Passed Out</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                  <input type="date" value={form.dob} onChange={(e) => updateFormField(setForm, "dob", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200" required />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={submitting || !isRegistrationAllowed} className="w-full bg-blue-200 text-blue-600 py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-500 hover:text-white focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]">
                  {submitting ? (<div className="flex items-center justify-center space-x-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Processing Registration...</span></div>) : "Complete Registration"}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">* Required fields</p>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Need help? Contact our support team at support@example.com</p>
        </div>
      </div>
    </div>
  );
}
