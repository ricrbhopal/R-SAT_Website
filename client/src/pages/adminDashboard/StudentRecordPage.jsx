import React, { useEffect, useState, useMemo } from "react";
import { AdminAPI } from "../../config/api.js";
import Silder from "./Silder.jsx";
import {
  FiUser,
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiDownload,
} from "react-icons/fi";
import ViewModalPage from "./modals/StudentRecordModals.jsx/ViewModalPage.jsx";
import EditModalPage from "./modals/StudentRecordModals.jsx/EditModalPage.jsx";
import DeleteModalPage from "./modals/StudentRecordModals.jsx/DeleteModalPage.jsx";
import { MdOutlineDeleteOutline } from "react-icons/md";
import * as XLSX from "xlsx";

export default function StudentRecordPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedEditStudentId, setSelectedEditStudentId] = useState(null);
  const [selectedDeleteStudentId, setSelectedDeleteStudentId] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await AdminAPI.getAllStudents();
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("fetchStudents error:", err);
      setError("Failed to fetch student records. Please try again later.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToggle]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.name || s.fullName || "").toString().toLowerCase();
      const email = (s.email || "").toString().toLowerCase();
      const phone = (s.phone || s.mobile || "").toString().toLowerCase();
      const roll = (s.roll || s.rollNumber || "").toString().toLowerCase();
      const fatherName = (s.fatherName || s.parentName || "")
        .toString()
        .toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        roll.includes(q) ||
        fatherName.includes(q)
      );
    });
  }, [students, query]);

  // Excel Download Function
  const downloadExcel = () => {
    const dataToExport = filteredStudents.map((student, index) => ({
      "S.No": index + 1,
      "Student Name": student.name || student.fullName || "Unknown",
      "R-SAT ID": student.student_ID || student.email || "-",
      Email: student.mail_ID || student.email || "-",
      Phone: student.phoneNo || student.phone || student.mobile || "-",
      "Date of Birth": student.dob
        ? typeof student.dob === "string"
          ? student.dob.split("T")[0]
          : student.dob
        : "-",
      College: student.college || "-",
      Branch: student.branch || "-",
      Year: student.year || student.className || student.grade || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Data");
    XLSX.writeFile(
      workbook,
      `students-data-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50">
        <div className="bg-red-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-800">
            Error Loading Student Records
          </h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen ">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
       
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-br from-green-500 to-cyan-500  bg-clip-text text-transparent">
            Manage  Student Records
            </h2>
            <p className="text-xs sm:text-sm text-black/60 font-semibold mt-5  ">
              Total students:{" "}
              <span className="font-medium text-black/70 ">
                {students.length}
              </span>
              {query && (
                <span className="ml-2">
                  • Filtered:{" "}
                  <span className="font-medium text-green-500">
                    {filteredStudents.length}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-9 pr-4 py-2 shadow-sm border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2  focus:ring-emerald-200 focus:border-emerald-500"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={downloadExcel}
              disabled={filteredStudents.length === 0}
              className="inline-flex shadow-sm cursor-pointer items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg transition-colors bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Excel"
            >
              <FiDownload size={16} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => setRefreshToggle((t) => !t)}
              className="inline-flex shadow-sm cursor-pointer items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg  transition-colors  bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-200"
              title="Refresh"
            >
              <FiRefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4xl shadow-lg border border-gray-200 p-4 sm:p-6 ">
        {/* Mobile Stats */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total</div>
            <div className="text-lg font-bold text-gray-900">
              {students.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Showing</div>
            <div className="text-lg font-bold text-blue-600">
              {filteredStudents.length}
            </div>
          </div>
        </div>

        {/* Students Table/List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FiUser className="mx-auto mb-4 text-gray-400" size={40} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No students found
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {query
                ? "Try changing your search query"
                : "No student records available"}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setRefreshToggle((t) => !t);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {query ? "Clear Search" : "Refresh"}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      R-SAT ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((s, idx) => {
                    const id = s._id ?? s.id ?? idx;
                    const name = s.name ?? s.fullName ?? "Unknown";
                    const email = s.email ?? s.student_ID ?? "-";
                    const phone =
                      s.phone ?? (s.dob ? s.dob.split("T")[0] : "-");
                    const cls = s.className ?? s.phoneNo ?? s.grade ?? "-";
                    const avatarLetter = name.charAt(0).toUpperCase();

                    return (
                      <tr
                        key={id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-700">
                              {avatarLetter}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {s.fatherName ?? s.parentName ?? ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {phone}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cls}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedStudentId(id)}
                              className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              title="View"
                            >
                              <FiEye size={14} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setSelectedEditStudentId(id)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setSelectedDeleteStudentId(id)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <MdOutlineDeleteOutline size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredStudents.map((s, idx) => {
                const id = s._id ?? s.id ?? idx;
                const name = s.name ?? s.fullName ?? "Unknown";
                const email = s.email ?? s.student_ID ?? "-";
                const phone = s.phone ?? (s.dob ? s.dob.split("T")[0] : "-");
                const cls = s.className ?? s.phone ?? s.grade ?? "-";
                const avatarLetter = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-lg">
                          {avatarLetter}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-500">
                            {s.fatherName ?? s.parentName ?? ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">R-SAT ID:</span>
                        <p className="font-medium">{email}</p>
                      </div>
                  
                      <div className="col-span-2">
                        <span className="text-gray-500">Password:</span>
                        <p className="font-medium">{phone}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedStudentId(id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <FiEye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => setSelectedEditStudentId(id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <FiEdit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedDeleteStudentId(id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        <MdOutlineDeleteOutline size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedStudentId && (
        <ViewModalPage
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {selectedEditStudentId && (
        <EditModalPage
          studentId={selectedEditStudentId}
          onClose={() => setSelectedEditStudentId(null)}
        />
      )}

      {selectedDeleteStudentId && (
        <DeleteModalPage
          studentId={selectedDeleteStudentId}
          onClose={() => setSelectedDeleteStudentId(null)}
        />
      )}
    </div>
  );
}
