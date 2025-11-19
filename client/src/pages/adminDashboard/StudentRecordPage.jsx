import React, { useEffect, useState, useMemo } from "react";
import { AdminAPI } from "../../config/api.js";
import Silder from "./Silder.jsx";
import { FiUser, FiUsers, FiSearch, FiRefreshCw, FiEye, FiEdit } from "react-icons/fi";
import ViewModalPage from "../adminDashboard/modals/ViewModalPage.jsx"; // Import the modal component
import EditModalPage from "../adminDashboard/modals/EditModalPage.jsx"; // Import the EditModalPage component
import DeleteModalPage from "../adminDashboard/modals/DeleteModalPage.jsx"; // Import the DeleteModalPage component
import { MdOutlineDeleteOutline } from "react-icons/md";
export default function StudentRecordPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null); // State for selected student ID
  const [selectedEditStudentId, setSelectedEditStudentId] = useState(null); // State for selected student ID for editing
  const [selectedDeleteStudentId, setSelectedDeleteStudentId] = useState(null); // State for selected student ID for deleting

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await AdminAPI.getAllStudents();
      // assume response.data is an array of students
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
      return name.includes(q) || email.includes(q) || phone.includes(q) || roll.includes(q);
    });
  }, [students, query]);

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
          <h3 className="text-lg font-semibold text-red-800">Error Loading Student Records</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Optional top slider/banner */}


      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <FiUsers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Student Records</h2>
              <p className="text-sm text-gray-500">
                Total students: <span className="font-medium text-gray-700">{students.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone or roll..."
                className="pl-10 pr-4 py-2 border rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            <button
              onClick={() => setRefreshToggle((t) => !t)}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
              title="Refresh"
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>

        {/* If no students found after filtering */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto mb-4 text-gray-400" size={40} />
            <h3 className="text-lg font-semibold text-gray-800">No students found</h3>
            <p className="text-gray-500 mt-2">
              Try changing your search or click{" "}
              <button
                onClick={() => setRefreshToggle((t) => !t)}
                className="text-blue-600 underline"
              >
                Refresh
              </button>{" "}
              to reload.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">R-SAT ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Password</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student Year</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredStudents.map((s, idx) => {
                  const id = s._id ?? s.id ?? idx;
                  const name = s.name ?? s.fullName ?? "Unknown";
                  const email = s.email ?? s.student_ID ?? "-";
                  const phone = s.phone ?? (s.dob ? s.dob.split("T")[0] : "-");
                  const cls = s.className ?? s.year ?? s.grade ?? "-";
                  const avatarLetter = name.charAt(0).toUpperCase();

                  return (
                    <tr key={id}>
                      <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                            {avatarLetter}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{s.fatherName ?? s.parentName ?? ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{cls}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              // view student - open modal or navigate
                              // implement navigation or modal opening here
                              console.log("view", id);
                              setSelectedStudentId(id); // Set the selected student ID
                            }}
                            className="inline-flex items-center gap-2 px-3 cursor-pointer py-1.5 border rounded-md hover:bg-gray-50"
                            title="View"
                          >
                            <FiEye />
                            <span className="hidden sm:inline font-semibold">View</span>
                          </button>

                          <button
                            onClick={() => {
                              // edit student
                              console.log("edit", id);
                              setSelectedEditStudentId(id); // Set the selected student ID for editing
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-200 text-blue-600 rounded-md hover:bg-blue-400 cursor-pointer hover:text-white"
                            title="Edit"
                          >
                            <FiEdit />
                            <span className="hidden sm:inline font-semibold">Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              // delete student
                              console.log("delete", id);
                              setSelectedDeleteStudentId(id); // Set the selected student ID for deleting
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-200 text-red-600 rounded-md hover:bg-red-400 cursor-pointer hover:text-white"
                            title="Delete "
                          >
                            <MdOutlineDeleteOutline size={16} />
                            <span className="hidden sm:inline font-semibold">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render the modal if a student is selected */}
      {selectedStudentId && (
        <ViewModalPage
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)} // Close the modal
        />
      )}

      {/* Render the EditModalPage if a student is selected for editing */}
      {selectedEditStudentId && (
        <EditModalPage
          studentId={selectedEditStudentId}
          onClose={() => setSelectedEditStudentId(null)} // Close the modal
        />
      )}

      {/* Render the DeleteModalPage if a student is selected for deleting */}
      {selectedDeleteStudentId && (
        <DeleteModalPage
          studentId={selectedDeleteStudentId}
          onClose={() => setSelectedDeleteStudentId(null)} // Close the modal
        />
      )}

    </div>
  );
}
