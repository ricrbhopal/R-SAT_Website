// src/pages/modals/DeleteModal.jsx
import React, { useEffect, useState } from "react";
// Adjust relative path to your config/api file. From src/pages/modals -> src/config is '../../config' or '../../../config' depending on folder depth.
// If your ReferredPage imports AdminAPI from "../../config/api.js" then this file is one more nested level, so use "../../../config/api.js"
import { AdminAPI } from "../../../../config/api.js";

export default function DeleteModalPage({ studentId, initialData = null, onClose }) {
  const [student, setStudent] = useState(initialData ?? null);
  const [loading, setLoading] = useState(Boolean(initialData ? false : true));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    // If parent already provided initialData, use it and skip fetch
    if (initialData) {
      setStudent(initialData);
      setLoading(false);
      setError("");
      return () => (mounted = false);
    }

    // If no id and no initialData, show modal only if you want — here we do nothing (but don't early return null).
    if (!studentId) {
      setStudent(null);
      setLoading(false);
      setError("");
      return () => (mounted = false);
    }

    const fetchStudent = async () => {
      setLoading(true);
      setError("");
      try {
        // ensure AdminAPI.getStudentById exists and points to correct route
        if (typeof AdminAPI.getStudentById === "function") {
          const resp = await AdminAPI.getStudentById(studentId);
          if (!mounted) return;
          setStudent(resp?.data ?? resp ?? null);
        } else if (typeof AdminAPI.getRefferedUserById === "function") {
          // fallback name
          const resp = await AdminAPI.getRefferedUserById(studentId);
          if (!mounted) return;
          setStudent(resp?.data ?? resp ?? null);
        } else {
          // Final fallback: try raw GET path (adjust path if your server uses different route)
          try {
            const resp = await AdminAPI.get?.(`/admin/reffered-users/${studentId}`);
            if (!mounted) return;
            setStudent(resp?.data ?? resp ?? null);
          } catch (err) {
            throw err;
          }
        }
      } catch (err) {
        console.error("[DeleteModal] Error fetching student:", err);
        if (!mounted) return;
        setError("Failed to fetch student details. Please try again later.");
        setStudent(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchStudent();

    return () => {
      mounted = false;
    };
  }, [studentId, initialData]);

  const handleDelete = async () => {
    if (!studentId && !student?._id) {
      setError("No referral specified for deletion.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const idToDelete = studentId ?? student._id;
      // Always use AdminAPI.deleteRefferedUser for referrals
      await AdminAPI.deleteRefferedUser(idToDelete);
      onClose?.();
    } catch (err) {
      console.error("[DeleteModal] Error deleting referral:", err);
      setError("Failed to delete referral. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If neither id nor initialData provided — don't render modal
  if (!studentId && !initialData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Referral</h2>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this referral record?
              <br />
              <span className="font-semibold">{student?.fullName || student?.referredName || student?.refCode || "(no name)"}</span>
              <br />
              <span className="text-xs text-gray-500">You can delete any referral, even if the referred user has not filled the form.</span>
              <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-200 text-red-600 font-semibold hover:text-white rounded-md hover:bg-red-400 transition-colors"
              >
                Delete
              </button>
              <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
