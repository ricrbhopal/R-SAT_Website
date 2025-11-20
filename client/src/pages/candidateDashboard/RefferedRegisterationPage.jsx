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
    <div className="flex items-center justify-center bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} pauseOnHover />
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Referral Registration</h1>

        {/* Show referral metadata */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Referral Code: <span className="font-mono text-sm">{refParam || "—"}</span>
          </p>
          {studentIdParam && (
            <p className="text-sm text-gray-600">
              studentId param: <span className="font-medium">{studentIdParam}</span>
            </p>
          )}
        </div>

        {loadingReferrer ? (
          <p>Loading referrer details...</p>
        ) : referrer ? (
          <div className="mb-4">
            <p>
              Referred by:{" "}
              <strong>{referrer.fullName || referrer.student_ID || "Referrer"}</strong>{" "}
              { (referrer.student_ID || referrer.userId || referrer.id) && (
                <span className="ml-2 text-sm text-gray-500">
                  {referrer.student_ID ? `(${referrer.student_ID})` : null}
                  {referrer.userId ? ` id:${referrer.userId}` : null}
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="mb-4 text-red-500">Invalid or missing referral link.</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => updateFormField(setForm, "fullName", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.referredEmail}
              onChange={(e) => updateFormField(setForm, "referredEmail", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={form.referredPhone}
              onChange={(e) => updateFormField(setForm, "referredPhone", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">College Name</label>
            <input
              type="text"
              value={form.collegeName}
              onChange={(e) => updateFormField(setForm, "collegeName", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Branch</label>
            <input
              type="text"
              value={form.branch}
              onChange={(e) => updateFormField(setForm, "branch", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Academic Year</label>
            <select
              value={form.year}
              onChange={(e) => updateFormField(setForm, "year", e.target.value)}
              className="w-full border rounded px-3 py-2"
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

          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => updateFormField(setForm, "dob", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
