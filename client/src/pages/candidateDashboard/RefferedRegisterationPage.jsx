// src/pages/ReferredPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReferralAPI } from "../../config/api.js"; // आपका axios wrapper

// Custom hook to read query params and log full URL for debugging
const useQuery = () => {
  // log full URL to help debugging in devtools
  const { search } = useLocation();
  return new URLSearchParams(search);
};

/**
 * Decode a JWT payload (no external lib).
 * Returns parsed payload object or null on failure.
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;

  // Remove "Bearer " prefix if present
  const cleaned = token.trim().startsWith("Bearer ")
    ? token.trim().slice(7)
    : token.trim();

  const parts = cleaned.split(".");
  if (parts.length < 2) return null;

  const payloadB64 = parts[1];

  // Convert base64url to base64
  const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;

  try {
    // atob decodes base64
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to decode JWT payload:", e);
    return null;
  }
}

/**
 * Try to find token from common places (localStorage, sessionStorage,
 * or inside a stored `user` object). Returns token string or null.
 */
function getStoredToken() {
  const keys = ["token", "accessToken", "authToken", "jwt"];
  for (const k of keys) {
    const vLocal = localStorage.getItem(k);
    if (vLocal) return vLocal;
    const vSession = sessionStorage.getItem(k);
    if (vSession) return vSession;
  }

  // Sometimes token is stored inside a saved user object
  try {
    const maybeUserLocal = localStorage.getItem("user");
    if (maybeUserLocal) {
      const u = JSON.parse(maybeUserLocal);
      if (u?.token) return u.token;
      if (u?.accessToken) return u.accessToken;
    }
  } catch (e) {
    // ignore JSON parse errors
  }

  try {
    const maybeUserSession = sessionStorage.getItem("user");
    if (maybeUserSession) {
      const u = JSON.parse(maybeUserSession);
      if (u?.token) return u.token;
      if (u?.accessToken) return u.accessToken;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/* small helper placed below to keep JSX cleaner */
function updateFormField(setForm, key, value) {
  setForm((s) => ({ ...s, [key]: value }));
}

export default function ReferredPage() {
  const query = useQuery();
  // accept many possible param names
  const referrerIdFromUrl =
    query.get("ref") ||
    query.get("referrer") ||
    query.get("referrerId") ||
    query.get("refId") ||
    query.get("rid") ||
    "";

  const [referrer, setReferrer] = useState(null); // optional meta about referrer
  const [loadingReferrer, setLoadingReferrer] = useState(false);

  const [form, setForm] = useState({
    referredName: "",
    referredEmail: "",
    referredPhone: "",
    collegeName: "",
    year: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!referrerIdFromUrl) {
      console.warn("No referral ID found in the URL.");
      setReferrer(null);
      return;
    }

    const fetchReferrer = async () => {
      try {
        setLoadingReferrer(true);
        if (ReferralAPI?.getReferrer) {
          const res = await ReferralAPI.getReferrer(referrerIdFromUrl);
          console.log("Referrer data fetched:", res?.data);
          setReferrer(res?.data || { _id: referrerIdFromUrl });
        } else {
          setReferrer({ _id: referrerIdFromUrl });
        }
      } catch (err) {
        console.error("Error fetching referrer data:", err);
        setReferrer({ _id: referrerIdFromUrl });
      } finally {
        setLoadingReferrer(false);
      }
    };

    fetchReferrer();
  }, [referrerIdFromUrl]);

  const validateForm = () => {
    if (!form.referredName.trim()) return "Please enter full name.";
    if (!form.referredEmail.trim()) return "Please enter email.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.referredEmail.trim()))
      return "Please enter a valid email.";
    if (!form.referredPhone.trim()) return "Please enter phone number.";
    if (!/^\d{10,15}$/.test(form.referredPhone.replace(/\D/g, "")))
      return "Please enter valid phone (10-15 digits).";
    if (!form.collegeName.trim())
      return "Please enter college / institute name.";
    if (!form.year.trim()) return "Please select academic year.";
    if (!referrerIdFromUrl) return "Referral link is invalid or missing.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setSubmitting(true);

      // Get token from storage (robust)
      const token = getStoredToken();
      console.log("Token found:", !!token);

      if (!token) {
        toast.error("You are not logged in. Please log in to continue.");
        return;
      }

      const decoded = decodeJwtPayload(token);
      console.log("Decoded token payload:", decoded);

      // Accept several possible claim names
      const studentId =
        decoded?.studentId ||
        decoded?.student_id ||
        decoded?.id ||
        decoded?.userId ||
        decoded?.user_id ||
        decoded?.sub;

      if (!studentId) {
        toast.error("Student ID not found in token. Please log in again.");
        return;
      }

      const payload = {
        referrerId: referrerIdFromUrl,
        studentId,
        referredName: form.referredName.trim(),
        referredEmail: form.referredEmail.trim(),
        referredPhone: form.referredPhone.trim(),
        collegeName: form.collegeName.trim(),
        year: form.year.trim(),
      };

      console.log("Payload being sent to backend:", payload);

      const res = await ReferralAPI.createReferral(payload);
      toast.success(res?.data?.message || "Referral submitted successfully!");

      setForm({
        referredName: "",
        referredEmail: "",
        referredPhone: "",
        collegeName: "",
        year: "",
      });
    } catch (error) {
      console.error("submit referral error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit referral. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className=" flex items-start justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6 mt-20 ">
      <div className="w-full max-w-3xl mt-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">
              Referral / Referred Student
            </h1>
            <p className="mt-1 text-sm opacity-90">
              Fill the form to complete your registration through a referral
              link.
            </p>
          </div>

          <div className="p-6">
            {/* Referrer summary */}
            <div className="mb-6">
              {/* <h3 className="text-sm font-semibold text-gray-700 mb-2">Referrer</h3> */}

              {/* {loadingReferrer ? (
                <div className="text-sm text-gray-500">Loading referrer details...</div>
              ) :  (
                <div className="text-sm text-red-600">Referral link not found or invalid. Please check the link.</div>
              )} */}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    value={form.referredName}
                    onChange={(e) =>
                      updateFormField(setForm, "referredName", e.target.value)
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    value={form.referredEmail}
                    onChange={(e) =>
                      updateFormField(setForm, "referredEmail", e.target.value)
                    }
                    type="email"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    value={form.referredPhone}
                    onChange={(e) =>
                      updateFormField(setForm, "referredPhone", e.target.value)
                    }
                    type="tel"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="10 digit mobile"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    College / Institute
                  </label>
                  <input
                    value={form.collegeName}
                    onChange={(e) =>
                      updateFormField(setForm, "collegeName", e.target.value)
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="College name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Academic Year
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) =>
                      updateFormField(setForm, "year", e.target.value)
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    required
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Passed Out">Passed Out</option>
                  </select>
                </div>
                {/* 
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referral ID (auto)</label>
                  <input
                    value={referrerIdFromUrl}
                    readOnly
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-sm"
                  />
                </div> */}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || !referrerIdFromUrl}
                  className="inline-flex items-center gap-3 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit & Register"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      referredName: "",
                      referredEmail: "",
                      referredPhone: "",
                      collegeName: "",
                      year: "",
                    })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Note: This will save referral details with the referrer's ID.
                The referred student's `referredStudentId` will be linked when
                they complete full registration (handled by backend).
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
