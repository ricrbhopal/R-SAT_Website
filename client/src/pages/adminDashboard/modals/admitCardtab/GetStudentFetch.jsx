// students.jsx
import React from "react";
import { FiSearch, FiUser, FiChevronDown, FiChevronUp, FiUsers } from "react-icons/fi";

export default function Students({ students = [], loading = false, searchTerm = "", setSearchTerm = () => {}, expandedStudent = null, toggleStudentExpand = () => {} }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Registered Students ({students.length})</h2>
        <div className="w-full sm:w-64">
          <div className="relative">
            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm sm:text-base" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : students.length > 0 ? (
        <div className="space-y-3">
          <div className="lg:hidden space-y-3">
            {students.map((student) => (
              <div key={student._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleStudentExpand(student._id)}>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg"><FiUser className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{student.fullName}</h3>
                      <p className="text-xs text-gray-500">{student.student_ID}</p>
                    </div>
                  </div>
                  {expandedStudent === student._id ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {expandedStudent === student._id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500 text-xs">Contact:</span><div className="font-medium text-gray-900">{student.phoneNo}</div></div>
                      <div><span className="text-gray-500 text-xs">College:</span><div className="font-medium text-gray-900 truncate">{student.college}</div></div>
                      <div><span className="text-gray-500 text-xs">Branch:</span><div className="font-medium text-gray-900">{student.branch}</div></div>
                      <div><span className="text-gray-500 text-xs">Year:</span><div className="font-medium text-gray-900">{student.year}</div></div>
                      <div><span className="text-gray-500 text-xs">Password:</span><div className="font-medium text-gray-900">{student.password}</div></div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_ID}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"><div className="flex items-center"><FiUser className="w-4 h-4 text-gray-400 mr-2" />{student.fullName}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.phoneNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.college}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.branch}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">No students are currently registered.</p>
        </div>
      )}
    </div>
  );
}
