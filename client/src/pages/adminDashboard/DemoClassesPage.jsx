// src/pages/DemoClassesPage.jsx
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../config/api.js";
import EditModal from "../adminDashboard/modals/DemoClassesModals.jsx/EditModal.jsx"
import DeleteDemoClassModal from "../adminDashboard/modals/DemoClassesModals.jsx/DeleteModal.jsx"
import { toast } from "react-toastify";

const DemoClassesPage = () => {
  const [demoClasses, setDemoClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchDemoClasses();
  }, []);

  const fetchDemoClasses = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.getAllDemoClasses();
      setDemoClasses(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching demo classes:", error);
      toast.error("Error fetching demo classes. Please try again.");
      setDemoClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (demoClass) => {
    setSelectedClass(demoClass);
    setIsViewModalOpen(true);
  };

  const handleEdit = (demoClass) => {
    setSelectedClass(demoClass);
    setIsEditModalOpen(true);
  };

  const handleDelete = (demoClass) => {
    setSelectedClass(demoClass);
    setIsDeleteModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedClass(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedClass(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-700 mt-4">Loading demo classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  ">
      <div className="max-w-7xl  px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  border-amber-200 text-amber-800">Demo Classes</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all demo class registrations
          </p>
        </div>

        {/* Table Container */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {demoClasses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200  shadow-md ">
                <thead className="bg-gray-50  justify-content-center">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demoClasses.map((demoClass, index) => {
                    const key =
                      demoClass?._id ?? demoClass?.email ?? `demo-${index}`;
                    return (
                      <tr
                        key={key}
                        className={
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {demoClass?.studentName || "Unnamed Student"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {demoClass?.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {demoClass?.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(demoClass)}
                              className=" cursor-pointer w-20 text-sm py-2    text-blue-600 hover:text-blue-900 bg-blue-50   hover:bg-blue-100 px-3  rounded-md  font-medium transition duration-200"
                            >
                              View
                            </button>

                            <button
                              onClick={() => handleEdit(demoClass)}
                              className=" cursor-pointer w-20 text-sm py-2    text-green-600 hover:text-green-900 bg-green-50   hover:bg-green-100 px-3  rounded-md  font-medium transition duration-200"
                              title="Local edit (no API)"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(demoClass)}
                              className=" cursor-pointer w-20 text-sm py-2    text-red-600 hover:text-red-900 bg-red-50   hover:bg-red-100 px-3  rounded-md  font-medium transition duration-200"
                              title="Remove from list (local only)"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No demo classes found
              </h3>
              <p className="text-gray-500">
                There are no demo class registrations at the moment.
              </p>
            </div>
          )}
        </div>

        {/* Inline View Modal */}
        {isViewModalOpen && selectedClass && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Demo Class Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Complete information about the registration
                  </p>
                </div>
                <button
                  onClick={closeViewModal}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Student Name
                    </p>
                    <p className="text-lg text-gray-900 mt-2 font-medium">
                      {selectedClass.studentName ?? "—"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Email
                    </p>
                    <p className="text-lg text-gray-900 mt-2 font-medium">
                      {selectedClass.email ?? "—"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Phone
                    </p>
                    <p className="text-lg text-gray-900 mt-2 font-medium">
                      {selectedClass.phone ?? "—"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Year
                    </p>
                    <p className="text-lg text-gray-900 mt-2 font-medium">
                      {selectedClass.year ?? "—"}
                    </p>
                  </div>

                  <div className="md:col-span-2 bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Slot
                    </p>
                    <p className="text-base text-gray-800 mt-2 whitespace-pre-wrap">
                      {selectedClass.demoSlot ?? "No message provided."}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase">
                      Type
                    </p>
                    <p className="text-lg text-gray-900 mt-2 font-medium">
                      {selectedClass.type ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
                <button
                  onClick={closeViewModal}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
            
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedClass && (
          <EditModal
            demoClass={selectedClass}
            onSave={(updatedClass) => {
              setDemoClasses((prev) =>
                prev.map((cls) => (cls._id === updatedClass._id ? updatedClass : cls))
              );
              closeEditModal();
            }}
            onClose={closeEditModal}
          />
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedClass && (
          <DeleteDemoClassModal
            demoClassId={selectedClass._id}
            onDelete={(deletedId) => {
              setDemoClasses((prev) => prev.filter((cls) => cls._id !== deletedId));
              closeDeleteModal();
            }}
            onClose={closeDeleteModal}
          />
        )}
      </div>
    </div>
  );
};

export default DemoClassesPage;
