import React, { useState } from "react";
import { AdminAPI } from "../../../../config/api";

export default function DeleteModal({ isOpen, onClose, admitCardId, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await AdminAPI.deleteAdmitCard(admitCardId);
      if (response.status === 200) {
        onDelete(); // Refresh the admit card list
        onClose(); // Close the modal
      } else {
        setError("Failed to delete admit card. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting admit card:", err);
      setError("An error occurred while deleting the admit card.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this admit card? This action cannot be undone.
          </p>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}