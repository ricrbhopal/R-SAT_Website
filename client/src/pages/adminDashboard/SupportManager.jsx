import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminAPI } from "../../config/api.js";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import {
  FiX,
  FiSearch,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiEye,
  FiMessageCircle,
  FiTrash2,
  FiSend,
  FiUser,
  FiPhone,
  FiMail,
  FiBarChart2,
  FiImage,
} from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:6501";

/*
  Reusable Modal that renders into document.body using a React Portal
  - open: boolean to show/hide
  - onClose: function to call when backdrop is clicked or modal wants to close
  - children: modal contents
  - className: extra classes for modal content wrapper
*/
const Modal = ({ open, onClose, children, className = "" }) => {
  useEffect(() => {
    if (!open) return;
    // lock body scroll when modal is open
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous || "unset";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Content */}
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>,
    document.body
  );
};

const SupportManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const chatQueryRef = useRef(null);
  const chatScrollRef = useRef(null);

  const normalizeQueryData = (query = {}) => {
    const studentCandidate =
      (query.student && typeof query.student === "object" && !Array.isArray(query.student) ? query.student : null) ||
      (query.studentId && typeof query.studentId === "object" && !Array.isArray(query.studentId) ? query.studentId : null) ||
      {};

    const studentIdValue =
      studentCandidate?.id ||
      (typeof query.studentId === "string" ? query.studentId : null) ||
      query.student_id ||
      query.studentID ||
      null;

    const responses = (() => {
      try {
        if (typeof query.responses === "string") return JSON.parse(query.responses);
        return Array.isArray(query.responses) ? query.responses : [];
      } catch {
        return [];
      }
    })();

    return {
      id: query._id || query.id,
      student: studentCandidate,
      studentId: studentIdValue,
      subject: query.subject,
      description: query.description,
      status: query.status,
      imageUrl: query.imageUrl,
      responses,
      createdAt: query.createdAt ? new Date(query.createdAt).toLocaleString() : "N/A",
      updatedAt: query.updatedAt ? new Date(query.updatedAt).toLocaleString() : "N/A",
    };
  };

  // Modal states
  const [deleteModalQuery, setDeleteModalQuery] = useState(null);
  const [viewQuery, setViewQuery] = useState(null);
  const [chatQuery, setChatQuery] = useState(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    chatQueryRef.current = chatQuery;
  }, [chatQuery]);

  useEffect(() => {
    // Auto-scroll chat to bottom when responses change
    if (chatQuery && chatScrollRef.current) {
      const el = chatScrollRef.current;
      requestAnimationFrame(() => {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        } catch (e) {
          // fallback
          el.scrollTop = el.scrollHeight;
        }
      });
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
      const normalized = query ? normalizeQueryData(query) : null;

      if (normalized) {
        setQueries((prev) => {
          let found = false;
          const updated = prev.map((q) => {
            if (q.id === normalized.id) {
              found = true;
              return { ...q, ...normalized };
            }
            return q;
          });
          return found ? updated : [...updated, normalized];
        });
      }

      if (chatQueryRef.current?.id === queryId) {
        setChatQuery((prev) => {
          if (!prev) return prev;
          const mergedResponses = normalized?.responses || responses || prev.responses;
          return { ...prev, ...(normalized || {}), responses: mergedResponses };
        });
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
      const mappedQueries = (response?.data || []).map((query) => normalizeQueryData(query));
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
    const normalized = normalizeQueryData(query);
    setChatQuery(normalized);
    setNewMessage("");
    if (socketRef.current && normalized?.id) {
      socketRef.current.emit("join_support", { queryId: normalized.id });
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
    const normalized = normalizeQueryData(query);
    const student = normalized.student || {};
    setViewQuery({
      ...normalized,
      studentName: student.fullName || "Unknown",
      studentPhone: student.phoneNo || "Unknown",
      studentEmail: student.mail_ID || "Unknown",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <FiMessageSquare className="text-blue-600" />;
      case "in_progress":
        return <FiClock className="text-yellow-600" />;
      case "resolved":
        return <FiCheckCircle className="text-green-600" />;
      default:
        return <FiMessageSquare className="text-gray-500" />;
    }
  };

  const filteredQueries = queries.filter((query) => {
    const search = searchTerm.toLowerCase();
    return (
      (query.subject && query.subject.toLowerCase().includes(search)) ||
      (query.student?.fullName && query.student.fullName.toLowerCase().includes(search)) ||
      (query.status && query.status.toLowerCase().includes(search)) ||
      (query.createdAt && query.createdAt.toLowerCase().includes(search)) ||
      (query.updatedAt && query.updatedAt.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="text-gray-700 mt-4">Loading support queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Delete Modal */}
      <Modal open={!!deleteModalQuery} onClose={() => setDeleteModalQuery(null)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 transform transition-all duration-300">
          <div className="px-6 py-5 border-b border-gray-200 rounded-t-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Delete Support Query</h3>
            <p className="text-gray-600 mt-2">Are you sure you want to delete this query?</p>
            <p className="text-gray-500 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="px-6 py-6 flex gap-4">
            <button
              onClick={() => setDeleteModalQuery(null)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition duration-200 font-medium border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteQuery(deleteModalQuery.id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition duration-200 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewQuery} onClose={() => setViewQuery(null)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[65vh] overflow-y-auto relative z-10 transform transition-all duration-300">
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl z-20">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Query Details</h3>
              <button
                onClick={() => setViewQuery(null)}
                className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 hover:bg-white rounded-lg cursor-pointer"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4 ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Student Name" value={viewQuery?.studentName} icon={<FiUser className="w-4 h-4" />} />
              <DetailItem label="Phone" value={viewQuery?.studentPhone} icon={<FiPhone className="w-4 h-4" />} />
              <DetailItem label="Email" value={viewQuery?.studentEmail} icon={<FiMail className="w-4 h-4" />} />
              <DetailItem label="Status" value={viewQuery?.status?.replace('_', ' ' )?.toUpperCase()} icon={<FiBarChart2 className="w-4 h-4" />} />
            </div>
            <DetailItem label="Subject" value={viewQuery?.subject} icon={<FiMessageSquare className="w-4 h-4" />} />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 items-center">
                <span className="mr-2"><FiMessageSquare className="w-4 h-4" /></span>
                Description
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{viewQuery?.description}</p>
              </div>
            </div>
            {viewQuery?.imageUrl && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 items-center">
                  <span className="mr-2"><FiImage className="w-4 h-4" /></span>
                  Attachment
                </label>
                <img src={viewQuery.imageUrl} alt="Query Attachment" className="mt-2 max-w-full h-auto rounded-lg border border-gray-200" />
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
            <button onClick={() => setViewQuery(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition duration-200 font-medium">Close</button>
          </div>
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal open={!!chatQuery} onClose={() => setChatQuery(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden relative z-10 transform transition-all duration-300">
          {/* Chat Header */}
          <div className="sticky w-[500px] top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between z-20">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{chatQuery?.subject}</h3>
              <p className="text-xs text-green-100">Chat with {chatQuery?.student?.fullName || "Student"}</p>
            </div>
            <button onClick={() => setChatQuery(null)} className="p-2 hover:bg-green-500 rounded-full transition">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Container */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {/* Initial Query */}
            {chatQuery && (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-3xl rounded-tr-sm px-4 py-3 max-w-xs">
                  <p className="text-sm break-words">{chatQuery.description}</p>
                  <p className="text-xs mt-2 text-blue-100">{new Date(chatQuery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )}

            {/* All Responses */}
            {chatQuery?.responses && chatQuery.responses.length > 0 ? (
              chatQuery.responses.map((response, idx) => {
                const isAdmin = response.senderType === "ADMIN";
                return (
                  <div key={response.id || idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-3xl px-4 py-3 max-w-xs ${isAdmin ? "bg-green-600 text-white rounded-tr-sm" : "bg-gray-200 text-gray-900 rounded-tl-sm"}`}>
                      {!isAdmin && (
                        <p className="text-xs font-semibold text-gray-700 mb-1">{response.responder || "Student"}</p>
                      )}
                      <p className="text-sm break-words">{response.message}</p>
                      <p className={`text-xs mt-2 ${isAdmin ? "text-green-100" : "text-gray-500"}`}>{new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <FiMessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation with the student</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-end gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none min-h-[44px] max-h-[120px]"
              rows="1"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-lg flex items-center justify-center transition ${newMessage.trim() ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-6">
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
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-full outline-none"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiMessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{queries.filter(q => q.status === 'open' || q.status === 'in_progress').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{queries.filter(q => q.status === 'resolved').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Queries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop / Tablet table */}
          <div className="hidden md:block">
            {filteredQueries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQueries.map((query) => (
                      <tr key={query.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">{query.student?.fullName?.charAt(0)?.toUpperCase() || 'S'}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{query.student?.fullName || 'Unknown Student'}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{query.subject}</div>
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
                          <div><div><span className="font-semibold">Created:</span> {query.createdAt || "N/A"}</div></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleViewQuery(query)} className="inline-flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors duration-200">
                              <FiEye className="w-4 h-4 mr-1" />
                              View
                            </button>

                            <button onClick={() => handleOpenChat(query)} className="inline-flex items-center px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors duration-200">
                              <FiMessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </button>

                            <button onClick={() => updateQueryStatus(query.id, "resolved")} className="inline-flex items-center px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors duration-200">
                              <FiCheckCircle className="w-4 h-4 mr-1" />
                              Resolve
                            </button>

                            <button onClick={() => setDeleteModalQuery(query)} className="inline-flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors duration-200">
                              <FiTrash2 className="w-4 h-4 mr-1" />
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
                <FiMessageSquare className="text-gray-400 text-6xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support queries found</h3>
                <p className="text-gray-500">{searchTerm ? 'No queries match your search criteria.' : 'There are no support queries at the moment.'}</p>
              </div>
            )}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden p-4 ">
            {filteredQueries.length > 0 ? (
              <div className="space-y-4">
                {filteredQueries.map((query) => (
                  <div key={query.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">{query.student?.fullName?.charAt(0)?.toUpperCase() || 'S'}</div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{query.student?.fullName || "Unknown Student"}</div>
                            <div className="text-xs text-gray-500">{query.subject}</div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}><span className="mr-1">{getStatusIcon(query.status)}</span>{query.status.replace('_', ' ')}</div>
                            <div className="text-xs text-gray-400 mt-1">{query.createdAt}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => handleViewQuery(query)} className="text-xs bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-blue-700 transition-colors duration-200">View</button>
                          <button onClick={() => handleOpenChat(query)} className="text-xs bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg text-green-700 transition-colors duration-200">Chat</button>
                          <button onClick={() => updateQueryStatus(query.id, "resolved")} className="text-xs bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg text-purple-700 transition-colors duration-200">Resolve</button>
                          <button onClick={() => setDeleteModalQuery(query)} className="text-xs bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-red-700 transition-colors duration-200">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiMessageSquare className="text-gray-400 text-6xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support queries found</h3>
                <p className="text-gray-500">{searchTerm ? 'No queries match your search criteria.' : 'There are no support queries at the moment.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
      <span className="mr-2">{icon}</span>
      {label}
    </label>
    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">{value || "N/A"}</p>
  </div>
);

export default SupportManager;
