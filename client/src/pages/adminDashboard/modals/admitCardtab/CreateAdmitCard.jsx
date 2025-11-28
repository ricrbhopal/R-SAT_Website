// createAdmitCard.jsx
import React from "react";
import { FiMapPin, FiCalendar, FiClock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function CreateAdmitCard({
  form = {},
  onFormChange = () => {},
  handleBulkCreate = () => {},
  studentsCount = 0,
  saving = false,
  message = { type: "", text: "" },
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Generate Admit Cards</h2>
        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">Create admit cards for all registered students with exam details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiMapPin className="inline w-4 h-4 mr-1 text-gray-400" /> Examination Venue *
          </label>
          <input name="venue" value={form?.venue || ""} onChange={onFormChange} placeholder="Enter examination venue" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCalendar className="inline w-4 h-4 mr-1 text-gray-400" /> Exam Date *
          </label>
          <input name="examDate" value={form?.examDate || ""} onChange={onFormChange} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiClock className="inline w-4 h-4 mr-1 text-gray-400" /> Exam Time *
          </label>
          <input name="examTime" value={form?.examTime || ""} onChange={onFormChange} type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiClock className="inline w-4 h-4 mr-1 text-gray-400" /> Reporting Time *
          </label>
          <input name="ReportingTime" value={form?.ReportingTime || ""} onChange={onFormChange} type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
          <select name="status" value={form?.status ?? "not_issued"} onChange={onFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base">
            <option value="not_issued">Not Issued</option>
            <option value="issued">Issued</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start">
          <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm text-blue-800">This will generate admit cards for all <strong>{studentsCount}</strong> registered students.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleBulkCreate} disabled={saving} className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors text-sm sm:text-base shadow-sm ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
          {saving ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            `Generate ${studentsCount} Admit Cards`
          )}
        </button>
      </div>

      {message?.text && (
        <div className={`p-3 rounded-lg border text-sm ${message?.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <div className="flex items-center">
            {message?.type === "success" ? <FiCheckCircle className="w-4 h-4 mr-2" /> : <FiAlertCircle className="w-4 h-4 mr-2" />}
            <span>{message?.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
