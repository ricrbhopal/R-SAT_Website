import React, { useEffect, useRef, useState } from "react";
import { AdminAPI } from "../../config/api.js";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:6501";

const SupportManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [viewQuery, setViewQuery] = useState(null);
  const [chatQuery, setChatQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const chatQueryRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    chatQueryRef.current = chatQuery;
    // Lock/unlock body scroll when modal is open
    if (chatQuery || viewQuery) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [chatQuery, viewQuery]);

  useEffect(() => {
    // Auto-scroll chat to bottom when messages change - but only scroll the modal, not the page
    if (chatQuery && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.parentElement?.scrollTo({
          top: chatEndRef.current.parentElement.scrollHeight,
          behavior: "smooth"
        });
      }, 0);
    }
  }, [chatQuery?.responses?.length]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket] admin connected", socket.id);
      toast.success("Connected to support server", { autoClose: 2000 });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] admin disconnected", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
      toast.warning("Disconnected from server", { autoClose: 2000 });
    });

    socket.on("connect_error", (error) => {
      console.error("[socket] connection error", error);
    });

    socket.on("support_message", ({ queryId, responses, query, clientMessageId }) => {
      if (query) {
        setQueries((prev) => prev.map((q) => (q.id === query.id ? { ...q, ...query, responses: query.responses || q.responses } : q)));
      }

      if (chatQueryRef.current?.id === queryId) {
        setChatQuery((prev) => (prev ? { ...prev, ...(query || {}), responses: query?.responses || responses || prev.responses } : prev));
      }
    });

    socket.on("support_error", ({ message }) => {
      if (message) toast.error(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.GetAllSupportQueries(filter);
      const mappedQueries = response.data.map((query) => ({
        id: query._id || query.id,
        studentId: query.student || query.studentId || {},
        subject: query.subject,
        description: query.description,
        status: query.status,
        imageUrl: query.imageUrl,
        responses: (() => {
          try {
            return typeof query.responses === 'string' ? JSON.parse(query.responses) : (Array.isArray(query.responses) ? query.responses : []);
          } catch (e) {
            return [];
          }
        })(),
        createdAt: new Date(query.createdAt).toLocaleString(),
        updatedAt: new Date(query.updatedAt).toLocaleString(),
      }));
      setQueries(mappedQueries);
    } catch (error) {
      toast.error("Failed to fetch support queries.");
    } finally {
      setLoading(false);
    }
  };

  const updateQueryStatus = async (queryId, status) => {
    if (!queryId) {
      toast.error("Error: Query ID not found");
      return;
    }
    try {
      const response = await AdminAPI.UpdateSupportQueryStatus(queryId, status);
      toast.success(response.data.message);
      setQueries((prev) => prev.map((q) => (q.id === queryId ? { ...q, status } : q)));
    } catch (error) {
      toast.error("Failed to update query status.");
    }
  };

  const [deleteModalQuery, setDeleteModalQuery] = useState(null);

  const deleteQuery = async (queryId) => {
    if (!queryId) {
      toast.error("Error: Query ID not found");
      console.error("queryId is undefined or null");
      return;
    }
    try {
      const response = await AdminAPI.DeleteSupportQuery(queryId);
      toast.success(response.data.message);
      setDeleteModalQuery(null);
      setQueries((prev) => prev.filter((q) => q.id !== queryId));
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error("Failed to delete support query.");
    }
  };

  const handleOpenChat = (query) => {
    setChatQuery(query);
    setNewMessage("");
    if (socketRef.current) {
      socketRef.current.emit("join_support", { queryId: query.id });
    }
  };

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) {
      toast.error("Message cannot be empty.");
      return;
    }

    if (!chatQuery?.id) {
      toast.error("No active chat.");
      return;
    }

    setNewMessage("");

    if (socketRef.current) {
      socketRef.current.emit("support_message", {
        queryId: chatQuery.id,
        message: text,
        senderType: "ADMIN",
        responder: "Support Team",
      });
    } else {
      try {
        const response = await AdminAPI.AddSupportQueryResponse(chatQuery.id, text);
        const updatedQuery = response?.data?.query || response?.data?.data || null;
        if (updatedQuery?.responses) {
          setChatQuery((prev) => ({ ...prev, ...updatedQuery }));
          setQueries((prev) => prev.map((q) => (q.id === chatQuery.id ? { ...q, ...updatedQuery } : q)));
        }
        toast.success(response?.data?.message || "Message sent successfully!");
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(error?.response?.data?.message || "Failed to send message.");
      }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-700 mt-4">Loading support queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-rose-800">Support Queries</h1>
              <p className="text-gray-600 mt-2">Manage and respond to student support requests</p>
            </div>
            <div className="w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-full outline-none"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {/* optional: filter select if needed */}
                {/* <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select> */}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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

        {/* Queries Table for md+ and Card list for small screens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop / Tablet table */}
          <div className="hidden md:block">
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
                            <div className="shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {query.studentId?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {query.studentId?.fullName || 'Unknown Student'}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {query.studentId?.mail_ID || query.subject}
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
                          <div className="flex flex-wrap gap-2">
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
                              onClick={() => handleOpenChat(query)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-medium transition duration-200 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Message
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

          {/* Mobile card list */}
          <div className="md:hidden p-4">
            {filteredQueries.length > 0 ? (
              <div className="space-y-4">
                {filteredQueries.map((query) => (
                  <div key={query.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {query.studentId?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {query.studentId?.fullName || "Unknown Student"}
                            </div>
                            <div className="text-xs text-gray-500">{query.studentId?.mail_ID || query.subject}</div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                              <span className="mr-1">{getStatusIcon(query.status)}</span>
                              {query.status.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{query.createdAt}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => handleViewQuery(query)} className="text-xs bg-blue-50 px-3 py-2 rounded-md text-blue-700">View</button>
                          <button onClick={() => handleOpenChat(query)} className="text-xs bg-green-50 px-3 py-2 rounded-md text-green-700">Message</button>
                          <button onClick={() => updateQueryStatus(query.id, "resolved")} className="text-xs bg-purple-50 px-3 py-2 rounded-md text-purple-700">Resolve</button>
                          <button onClick={() => setDeleteModalQuery(query)} className="text-xs bg-red-50 px-3 py-2 rounded-md text-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalQuery && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-5 border-b border-gray-200 rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-900">Delete Support Query</h3>
              <p className="text-gray-600 mt-2">Are you sure you want to delete this query?</p>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-6 flex gap-4">
              <button
                onClick={() => setDeleteModalQuery(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteQuery(deleteModalQuery.id)}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Query Modal */}
      {viewQuery && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
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

      {/* Chat Modal */}
      {chatQuery && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 ">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col mb-50" >
            {/* Chat Header */}
            <div className="px-6 py-4  border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chat with Student</h3>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Subject: </span>
                    <span className="font-medium ml-1">{chatQuery.subject}</span>
                  </div>
                  <span className="mx-2">•</span>
                  <div>
                    <span>Student: </span>
                    <span className="font-medium">{chatQuery.studentId?.fullName || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatQuery(null)}
                className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 hover:bg-white rounded-lg cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {chatQuery?.responses && chatQuery.responses.length > 0 ? (
                <div className="space-y-4">
                  {/* Initial query bubble */}
                  <div className="flex justify-end">
                    <div className="bg-blue-50 border border-blue-200 text-gray-800 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl">
                      <p className="text-sm font-semibold mb-1">Student</p>
                      <p className="text-sm whitespace-pre-wrap">{chatQuery?.description}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{chatQuery?.createdAt}</p>
                    </div>
                  </div>

                  {/* Admin and student responses */}
                  {chatQuery.responses.map((response, idx) => {
                    const isAdmin = response.senderType === "ADMIN";
                    return (
                      <div key={response.id || idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`px-4 py-3 max-w-xl rounded-2xl ${
                          isAdmin
                            ? "bg-green-50 border border-green-200 text-gray-900 rounded-tr-sm"
                            : "bg-blue-50 border border-blue-200 text-gray-800 rounded-tl-sm"
                        }`}>
                          <p className="text-xs font-semibold mb-1 text-gray-700">
                            {response.responder || (isAdmin ? "Support Team" : "Student")}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {new Date(response.createdAt || response.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p className="text-sm">Start the conversation with the student</p>
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="border-t border-gray-200 bg-white p-4 rounded-b-2xl">
              <div className="flex items-center space-x-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                  rows="2"
                  placeholder="Type your message here..."
                ></textarea>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`px-5 py-3 rounded-xl font-medium flex items-center justify-center ${
                    newMessage.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  } transition duration-200`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </button>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">
                  Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Enter</kbd> to send, <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Shift + Enter</kbd> for new line
                </p>
                <button
                  onClick={() => updateQueryStatus(chatQuery.id, "resolved")}
                  className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition duration-200 flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Resolved
                </button>
              </div>
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
