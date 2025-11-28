// admitCard.jsx
import React from "react";
import { FiSearch, FiCheckCircle,FiChevronDown, FiChevronUp, FiXCircle, FiEye, FiEdit, FiTrash2, FiFileText, FiCalendar, FiClock } from "react-icons/fi";

export default function AdmitCardTab({
  admitCards = [],
  filteredAdmitCards = [],
  loading = false,
  searchTerm = "",
  setSearchTerm = () => {},
  expandedAdmitCard = null,
  toggleAdmitCardExpand = () => {},
  handleViewDetails = () => {},
  handleEditClick = () => {},
  handleDeleteClick = () => {},
  formatDate = () => {},
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Admit Cards ({admitCards.length})</h2>
        <div className="w-full sm:w-64">
          <div className="relative">
            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" placeholder="Search admit cards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm sm:text-base" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : filteredAdmitCards.length > 0 ? (
        <div className="space-y-3">
          <div className="lg:hidden space-y-3">
            {filteredAdmitCards.map((card) => (
              <div key={card._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleAdmitCardExpand(card._id)}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${card.present ? "bg-green-100" : "bg-red-100"}`}>{card.present ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiXCircle className="w-4 h-4 text-red-600" />}</div>
                    <div><h3 className="font-medium text-gray-900 text-sm">{card.ApplicantName}</h3><p className="text-xs text-gray-500">{card.college}</p></div>
                  </div>
                  {expandedAdmitCard === card._id ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {expandedAdmitCard === card._id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-500 text-xs">Contact:</span><div className="font-medium text-gray-900">{card.contact}</div></div>
                        <div><span className="text-gray-500 text-xs">Branch:</span><div className="font-medium text-gray-900">{card.branch}</div></div>
                        <div><span className="text-gray-500 text-xs">Year:</span><div className="font-medium text-gray-900">{card.year}</div></div>
                        <div><span className="text-gray-500 text-xs">Date:</span><div className="font-medium text-gray-900">{formatDate(card.examDate)}</div></div>
                        <div className="col-span-2"><span className="text-gray-500 text-xs">Venue:</span><div className="font-medium text-gray-900 text-xs">{card.venue}</div></div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button onClick={() => handleViewDetails(card)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm border border-blue-200"><FiEye className="w-3 h-3" />View</button>
                        <button onClick={() => handleEditClick(card)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded text-sm border border-green-200"><FiEdit className="w-3 h-3" />Edit</button>
                        <button onClick={() => handleDeleteClick(card)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm border border-red-200"><FiTrash2 className="w-3 h-3" />Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:block border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College & Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmitCards.map((card) => (
                  <tr className="hover:bg-gray-50" key={card._id}>
                    <td className="px-4 py-3">
                      <div><div className="text-sm font-medium text-gray-900">{card.ApplicantName}</div><div className="text-sm text-gray-500">{card.contact}</div><div className="text-xs text-gray-400">Year: {card.year}</div></div>
                    </td>
                    <td className="px-4 py-3"><div className="text-sm text-gray-900">{card.college}</div><div className="text-sm text-gray-500">{card.branch}</div></td>
                    <td className="px-4 py-3"><div className="text-sm text-gray-900"><div className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />{formatDate(card.examDate)}</div><div className="text-sm text-gray-500 mt-1"><div className="flex items-center gap-1"><FiClock className="w-4 h-4" />{card.examTime}</div></div><div className="text-xs text-gray-400 mt-1">{card.venue}</div></div></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{card.present ? <span className="flex items-center text-green-600 gap-1"><FiCheckCircle className="w-5 h-5" />Present</span> : <span className="flex items-center text-red-500 gap-1"><FiXCircle className="w-5 h-5" />Absent</span>}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => handleViewDetails(card)} className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button><button onClick={() => handleEditClick(card)} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Edit"><FiEdit className="w-4 h-4" /></button><button onClick={() => handleDeleteClick(card)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No admit cards found</h3>
          <p className="mt-1 text-sm text-gray-500">{admitCards.length === 0 ? "Generate admit cards using the Generate Cards tab." : "No admit cards match your search criteria."}</p>
        </div>
      )}
    </div>
  );
}
