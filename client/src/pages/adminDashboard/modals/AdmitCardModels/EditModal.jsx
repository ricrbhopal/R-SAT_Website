import React, { useState, useEffect } from "react";
import { AdminAPI } from "../../../../config/api";

export default function EditModal({ isOpen, onClose, admitCard, onUpdate }) {
  const [formData, setFormData] = useState({
    venue: "",
    examDate: "",
    examTime: "",
    ReportingTime: "",
  });

  const [isBulkEdit, setIsBulkEdit] = useState(false); // State to toggle bulk edit mode

  useEffect(() => {
    if (admitCard) {
      setFormData({
        venue: admitCard.venue || "",
        examDate: admitCard.examDate ? new Date(admitCard.examDate).toISOString().split("T")[0] : "",
        examTime: admitCard.examTime || "",
        ReportingTime: admitCard.ReportingTime || "",
      });
    }
  }, [admitCard]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isBulkEdit) {
      try {
        const response = await AdminAPI.bulkUpdateAdmitCards(formData); // Call bulk update API
        if (response.status === 200) {
          onUpdate(); // Refresh the admit card list
          onClose(); // Close the modal
        } else {
          setError("Failed to update admit cards. Please try again.");
        }
      } catch (err) {
        console.error("Error updating admit cards:", err);
        setError("An error occurred while updating the admit cards.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!admitCard?.id && !admitCard?._id) {
        setError("Invalid admit card ID.");
        setLoading(false);
        return;
      }

      try {
        const cardId = admitCard.id || admitCard._id;
        const response = await AdminAPI.updateAdmitCard(cardId, formData);
        if (response.status === 200) {
          onUpdate(cardId, formData); // Pass updated data to parent
          onClose(); // Close the modal
        } else {
          setError("Failed to update admit card. Please try again.");
        }
      } catch (err) {
        console.error("Error updating admit card:", err);
        setError("An error occurred while updating the admit card.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{isBulkEdit ? "Bulk Edit Admit Cards" : "Edit Admit Card"}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
            <input
              type="date"
              name="examDate"
              value={formData.examDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Time</label>
            <input
              type="time"
              name="examTime"
              value={formData.examTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Time</label>
            <input
              type="time"
              name="ReportingTime"
              value={formData.ReportingTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bulkEdit"
              checked={isBulkEdit}
              onChange={() => setIsBulkEdit((prev) => !prev)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="bulkEdit" className="text-sm text-gray-700">
              Apply changes to all admit cards
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

