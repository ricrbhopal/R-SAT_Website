import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../config/api.js";
import { toast } from "react-toastify";

const SupportManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [viewQuery, setViewQuery] = useState(null);
  const [responseQuery, setResponseQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchQueries();
  }, [filter]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.GetAllSupportQueries({
        params: filter !== "all" ? { status: filter } : {},
      });
      setQueries(
        response.data.map((query) => ({
          id: query._id,
          studentId: query.studentId || {},
          subject: query.subject,
          description: query.description,
          status: query.status,
          imageUrl: query.imageUrl,
          responses: query.responses || [],
          createdAt: new Date(query.createdAt).toLocaleString(),
          updatedAt: new Date(query.updatedAt).toLocaleString(),
        }))
      );
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to fetch support queries.");
    } finally {
      setLoading(false);
    }
  };

  const updateQueryStatus = async (queryId, status) => {
    try {
      const response = await AdminAPI.UpdateSupportQueryStatus(queryId, status);
      toast.success(response.data.message);
      fetchQueries();
    } catch (error) {
      console.error("Error updating query status:", error);
      toast.error("Failed to update query status.");
    }
  };

  const addResponse = async () => {
    if (!responseMessage.trim()) {
      toast.error("Response message cannot be empty.");
      return;
    }

    try {
      const response = await AdminAPI.AddSupportQueryResponse(
        selectedQuery.id,
        "Admin",
        responseMessage
      );
      toast.success(response.data.message);
      setResponseMessage("");
      setSelectedQuery(null);
      fetchQueries();
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Failed to add response.");
    }
  };

  const [deleteModalQuery, setDeleteModalQuery] = useState(null);
  const deleteQuery = async (queryId) => {
    try {
      const response = await AdminAPI.DeleteSupportQuery(queryId);
      toast.success(response.data.message);
      setDeleteModalQuery(null);
      fetchQueries();
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error("Failed to delete support query.");
    }
  };

  const submitResponse = async () => {
    if (!responseMessage.trim()) {
      toast.error("Response message cannot be empty.");
      return;
    }

    try {
      const response = await AdminAPI.AddSupportQueryResponse(responseQuery.id, "Admin", responseMessage);
      toast.success(response.data.message);
      setResponseQuery(null);
      setResponseMessage("");
      fetchQueries();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response.");
    }
  };

  const handleViewQuery = (query) => {
    setViewQuery({
      ...query,
      studentName: query.studentId?.fullName || "Unknown",
      studentPhone: query.studentId?.phoneNo || "Unknown",
      studentEmail: query.studentId?.mail_ID || "Unknown",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '🔴';
      case 'in_progress': return '🟡';
      case 'resolved': return '🟢';
      default: return '⚪';
    }
  };

  const filteredQueries = queries.filter(query => {
    const search = searchTerm.toLowerCase();
    return (
      (query.subject && query.subject.toLowerCase().includes(search)) ||
      (query.studentId.fullName && query.studentId.fullName.toLowerCase().includes(search)) ||
      (query.status && query.status.toLowerCase().includes(search)) ||
      (query.createdAt && query.createdAt.toLowerCase().includes(search)) ||
      (query.updatedAt && query.updatedAt.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-700 mt-4">Loading support queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold    text-rose-800">Support Queries</h1>
              <p className="text-gray-600 mt-2">Manage and respond to student support requests</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-full sm:w-64 outline-none "
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {queries.filter(q => q.status === 'open' || q.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {queries.filter(q => q.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Queries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredQueries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student & Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQueries.map((query) => (
                    <tr key={query.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {query.studentId.fullName?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {query.studentId.fullName || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {query.subject}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                          <span className="mr-1">{getStatusIcon(query.status)}</span>
                          {query.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div><span className="font-semibold">Created:</span> {query.createdAt || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewQuery(query)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-medium transition duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => setResponseQuery(query)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-medium transition duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Respond
                          </button>
                          <button
                            onClick={() => updateQueryStatus(query.id, "resolved")}
                            className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg text-xs font-medium transition duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Resolve
                          </button>
                          <button
                            onClick={() => setDeleteModalQuery(query)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-medium transition duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                                                      {/* Delete Confirmation Modal */}
                                                      {deleteModalQuery && (
                                                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 ">
                                                          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mb-60">
                                                            <div className="px-6 py-5 border-b border-gray-200 rounded-t-2xl">
                                                              <h3 className="text-xl font-semibold text-gray-900">Delete Support Query</h3>
                                                              <p className="text-gray-600 mt-2">Are you sure you want to delete this query? </p>
                                                              <p>This action cannot be undone.</p>
                                                            </div>
                                                            <div className="px-6 py-6 flex gap-4">
                                                              <button
                                                                onClick={() => setDeleteModalQuery(null)}
                                                                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-200 font-medium cursor-pointer"
                                                              >
                                                                Cancel
                                                              </button>
                                                              <button
                                                                onClick={() => deleteQuery(deleteModalQuery.id)}
                                                                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition duration-200 font-medium cursor-pointer"
                                                              >
                                                                Delete
                                                              </button>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support queries found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No queries match your search criteria.' : 'There are no support queries at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Query Modal */}
      {viewQuery && (
        <div className="fixed inset-0 bg-black/40 bg-blur-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mb-30 h-160">
            <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Query Details</h3>
                <button
                  onClick={() => setViewQuery(null)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 hover:bg-white rounded-lg cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="Student Name" value={viewQuery.studentName} icon="👤" />
                <DetailItem label="Phone" value={viewQuery.studentPhone} icon="📱" />
                <DetailItem label="Email" value={viewQuery.studentEmail} icon="📧" />
                <DetailItem label="Status" value={viewQuery.status.replace('_', ' ').toUpperCase()} icon="📊" />
              </div>
              <DetailItem label="Subject" value={viewQuery.subject} icon="💭" />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 items-center">
                  <span className="mr-2">📝</span>
                  Description
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{viewQuery.description}</p>
                </div>
              </div>
              {viewQuery.imageUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 items-center">
                    <span className="mr-2">🖼️</span>
                    Attachment
                  </label>
                  <img
                    src={viewQuery.imageUrl}
                    alt="Query Attachment"
                    className="mt-2 max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setViewQuery(null)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Query Modal */}
      {responseQuery && (
        <div className="fixed inset-0 bg-black/40 bg-blur-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mb-60 ">
            <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Respond to Query</h3>
                <button
                  onClick={() => setResponseQuery(null)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 hover:bg-white rounded-lg cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Responding to: {responseQuery.subject}</p>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                rows="6"
                placeholder="Write your response here..."
              ></textarea>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex space-x-3">
              <button
                onClick={() => setResponseQuery(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-200 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition cursor-pointer duration-200 font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 items-center">
      <span className="mr-2">{icon}</span>
      {label}
    </label>
    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">{value || "N/A"}</p>
  </div>
);

export default SupportManager;