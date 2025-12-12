import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ManagerAPI } from "../../../config/api";
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
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:6501";

const Modal = ({ open, onClose, children, className = "", labelledBy = undefined }) => {
  const modalRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousActive = document.activeElement;
    document.body.style.overflow = "hidden";

    // Move focus into modal
    requestAnimationFrame(() => {
      try {
        const el = modalRef.current;
        if (!el) return;
        const focusable = el.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (focusable || el).focus();
      } catch (e) {
        // ignore
      }
    });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        // simple focus trap
        const el = modalRef.current;
        if (!el) return;
        const focusables = Array.from(
          el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter((n) => !n.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous || "unset";
      try {
        previousActive?.focus && previousActive.focus();
      } catch (e) {}
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        {...(labelledBy ? { 'aria-labelledby': labelledBy } : {})}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-full ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

const SupportManager = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const socketRef = useRef(null);
  const chatQueryRef = useRef(null);
  const chatScrollRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const searchDropdownRef = useRef(null);

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

    // canonicalize student fields for consistent rendering
    const canonicalStudent = { ...(studentCandidate || {}) };
    canonicalStudent.fullName =
      studentCandidate?.fullName || studentCandidate?.name || studentCandidate?.full_name ||
      [studentCandidate?.firstName, studentCandidate?.lastName].filter(Boolean).join(" ") || null;
    canonicalStudent.phoneNo =
      studentCandidate?.phoneNo || studentCandidate?.phone || studentCandidate?.mobile || studentCandidate?.contact || null;
    canonicalStudent.mail_ID =
      studentCandidate?.mail_ID || studentCandidate?.email || studentCandidate?.mail || null;

    return {
      id: query._id || query.id,
      student: canonicalStudent,
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

  const [deleteModalQuery, setDeleteModalQuery] = useState(null);
  const [viewQuery, setViewQuery] = useState(null);
  const [chatQuery, setChatQuery] = useState(null);

  useEffect(() => {
    fetchQueries();
  }, [filter]);

  useEffect(() => {
    chatQueryRef.current = chatQuery;
  }, [chatQuery]);

  useEffect(() => {
    if (chatQuery && chatScrollRef.current) {
      const el = chatScrollRef.current;
      requestAnimationFrame(() => {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        } catch (e) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  }, [chatQuery?.responses?.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      const response = await ManagerAPI.GetAllSupportQueries(filter);
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
      const response = await ManagerAPI.UpdateSupportQueryStatus(queryId, status);
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
      const response = await ManagerAPI.DeleteSupportQuery(queryId);
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
        const response = await ManagerAPI.AddSupportQueryResponse(chatQuery.id, text);
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
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/25";
      case "in_progress":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/25";
      case "resolved":
        return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/25";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-2 border-gray-400 shadow-lg shadow-gray-500/25";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <FiMessageSquare className="w-4 h-4" />;
      case "in_progress":
        return <FiClock className="w-4 h-4" />;
      case "resolved":
        return <FiCheckCircle className="w-4 h-4" />;
      default:
        return <FiMessageSquare className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (filter) => {
    switch (filter) {
      case "all": return "All Queries";
      case "open": return "Open";
      case "in_progress": return "In Progress";
      case "resolved": return "Resolved";
      default: return "All Queries";
    }
  };

  const getSearchFieldLabel = (field) => {
    switch (field) {
      case "all": return "All Fields";
      case "student": return "Student Name";
      case "subject": return "Subject";
      case "status": return "Status";
      case "date": return "Date";
      default: return "All Fields";
    }
  };

  const filteredQueries = queries.filter((query) => {
    if (filter !== "all" && query.status !== filter) return false;
    
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    switch (searchField) {
      case "student":
        return query.student?.fullName?.toLowerCase().includes(search);
      case "subject":
        return query.subject?.toLowerCase().includes(search);
      case "status":
        return query.status?.toLowerCase().includes(search);
      case "date":
        return query.createdAt?.toLowerCase().includes(search);
      case "all":
      default:
        return (
          query.student?.fullName?.toLowerCase().includes(search) ||
          query.subject?.toLowerCase().includes(search) ||
          query.status?.toLowerCase().includes(search) ||
          query.createdAt?.toLowerCase().includes(search)
        );
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent mx-auto mb-4 shadow-xl"></div>
          <p className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading support queries...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Delete Modal */}
      <Modal open={!!deleteModalQuery} onClose={() => setDeleteModalQuery(null)} className="max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl w-full border border-white/20">
          <div className="px-6 py-6 border-b border-white/10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center">
              <FiTrash2 className="w-6 h-6 mr-3" />
              Delete Query
            </h3>
            <p className="text-base text-white/90">Are you sure you want to delete this support query?</p>
            <p className="text-red-300 text-sm mt-1 font-medium">This action cannot be undone.</p>
          </div>
          <div className="px-6 py-6 flex gap-3">
            <button
              onClick={() => setDeleteModalQuery(null)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl transition-all duration-200 font-semibold border border-white/20 flex items-center justify-center gap-2"
            >
              <FiX className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={() => deleteQuery(deleteModalQuery.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewQuery} onClose={() => setViewQuery(null)} className=" w-[90vw] h-[85vh] ">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-3xl h-full flex flex-col border border-white/20 mx-auto overflow-hidden">
          <div className="sticky top-0 bg-white/18 backdrop-blur-sm px-6 py-4 border-b border-white/10 z-20">
            <div className="flex justify-between items-center ">
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent flex items-center">
                <FiEye className="w-6 h-6 mr-3 text-white/90" />
                Query Details
              </h3>
              <button
                onClick={() => setViewQuery(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Student Name" value={viewQuery?.studentName} icon={<FiUser className="w-5 h-5" />} />
              <DetailItem label="Phone" value={viewQuery?.studentPhone} icon={<FiPhone className="w-5 h-5" />} />
              <DetailItem label="Email" value={viewQuery?.studentEmail} icon={<FiMail className="w-5 h-5" />} />
              <DetailItem label="Status" value={viewQuery?.status?.replace('_', ' ').toUpperCase()} icon={<FiBarChart2 className="w-5 h-5" />} />
            </div>
            <DetailItem label="Subject" value={viewQuery?.subject} icon={<FiMessageSquare className="w-5 h-5" />} />
            <div>
              <label className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 flex items-center">
                <span className="mr-3 p-2 bg-white/10 rounded-xl"><FiMessageSquare className="w-5 h-5" /></span>
                Description
              </label>
              <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                <p className="text-base text-white/95 whitespace-pre-wrap leading-relaxed">{viewQuery?.description}</p>
              </div>
            </div>
            {viewQuery?.imageUrl && (
              <div>
                <label className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 flex items-center">
                  <span className="mr-3 p-2 bg-white/10 rounded-xl"><FiImage className="w-5 h-5" /></span>
                  Attachment
                </label>
                <img 
                  src={viewQuery.imageUrl} 
                  alt="Query Attachment" 
                  className="max-w-full h-auto rounded-xl border-2 border-white/20 shadow-md"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal open={!!chatQuery} onClose={() => setChatQuery(null)} className="max-w-3xl h-[85vh]">
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-3xl h-full flex flex-col overflow-hidden border border-white/20 mx-auto">
          <div className="sticky top-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between z-20 border-b border-white/20">
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-extrabold text-white truncate">{chatQuery?.subject}</h3>
              <p className="text-sm text-emerald-100 mt-1 truncate">Live chat with {chatQuery?.student?.fullName || "Student"}</p>
            </div>
            <button 
              onClick={() => setChatQuery(null)} 
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 ml-3"
            >
              <FiX className="w-5 h-5 text-white" />
            </button>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 bg-white/5 space-y-4 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
            {chatQuery && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-xl rounded-tr-md px-6 py-4 max-w-2xl border border-white/20">
                  <p className="text-base leading-relaxed">{chatQuery.description}</p>
                  <p className="text-xs mt-3 text-emerald-200 font-semibold">
                    {new Date(chatQuery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}

            {chatQuery?.responses && chatQuery.responses.length > 0 ? (
              chatQuery.responses.map((response, idx) => {
                const isAdmin = response.senderType === "ADMIN";
                return (
                  <div key={response.id || idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-xl px-6 py-4 max-w-2xl shadow-md border border-white/20 ${
                      isAdmin 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-md" 
                        : "bg-white/10 text-white rounded-tl-md"
                    }`}>
                      {!isAdmin && (
                        <p className="text-sm font-bold text-emerald-200 mb-2">{response.responder || "Student"}</p>
                      )}
                      <p className="text-base leading-relaxed">{response.message}</p>
                      <p className={`text-xs mt-2 font-bold ${isAdmin ? "text-emerald-100" : "text-purple-200"}`}>
                        {new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/60 p-8">
                <FiMessageSquare className="w-20 h-20 mb-6 opacity-40" />
                <p className="text-2xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  No messages yet
                </p>
                <p className="text-sm opacity-75">Start the conversation with the student</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white/10 backdrop-blur-xl border-t border-white/20 p-4 flex items-end gap-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-white/20 bg-white/5 text-white placeholder-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 resize-none min-h-[48px] max-h-[140px]"
              rows="1"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                newMessage.trim() 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-500/30' 
                  : 'bg-white/10 text-white/50 border border-white/20 cursor-not-allowed'
              }`}
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>

      <div className="max-w-5xl px-4 lg:px-8 mx-auto py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 py-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-emerald-300 bg-clip-text  tracking-tight mb-2">
                Support Queries
              </h1>
              <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                Manage and respond to student support requests with advanced filtering & search
              </p>
            </div>
            
            <div className="w-full lg:w-auto flex flex-col lg:flex-row gap-3">
              {/* Advanced Search Dropdown */}
              <div className="relative flex-1 lg:w-72" ref={searchDropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search in ${getSearchFieldLabel(searchField)}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-200"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <button
                    onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/8 hover:bg-white/16 rounded-md transition-all duration-200"
                  >
                    <FiChevronDown className={`w-4 h-4 text-white transition-transform duration-150 ${showSearchDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showSearchDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white/6 backdrop-blur-2xl border border-white/10 rounded-xl z-20 py-1">
                    {[
                      { value: "all", label: "All Fields", icon: FiSearch },
                      { value: "student", label: "Student Name", icon: FiUser },
                      { value: "subject", label: "Subject", icon: FiMessageSquare },
                      { value: "status", label: "Status", icon: FiBarChart2 },
                      { value: "date", label: "Date", icon: FiClock }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSearchField(value);
                          setShowSearchDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-white/10 transition-all duration-150 ${
                          searchField === value 
                            ? "bg-purple-500/10 text-purple-200 font-semibold" 
                            : "text-white/80"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Filter Dropdown */}
              <div className="relative lg:w-56" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white hover:bg-white/8 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <FiFilter className="w-4 h-4 text-purple-400" />
                    <span>{getFilterLabel(filter)}</span>
                  </div>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-150 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-full lg:w-56 bg-white/6 backdrop-blur-2xl border border-white/10 rounded-xl z-20 py-1">
                    {[
                      { value: "all", label: "All Queries", icon: FiMessageSquare },
                      { value: "open", label: "Open", icon: FiMessageSquare },
                      { value: "in_progress", label: "In Progress", icon: FiClock },
                      { value: "resolved", label: "Resolved", icon: FiCheckCircle }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setFilter(value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-white/10 transition-all duration-150 ${
                          filter === value 
                            ? "bg-emerald-500/10 text-emerald-200 font-semibold" 
                            : "text-white/80"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Total Queries"
            value={queries.length}
            icon={FiMessageSquare}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Pending"
            value={queries.filter(q => q.status === 'open' || q.status === 'in_progress').length}
            icon={FiClock}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Resolved"
            value={queries.filter(q => q.status === 'resolved').length}
            icon={FiCheckCircle}
            color="from-emerald-500 to-emerald-600"
          />
        </div>

        {/* Queries Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-md overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            {filteredQueries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Student & Subject</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredQueries.map((query) => (
                      <tr key={query.id} className="hover:bg-white/5 transition-all duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`shrink-0 h-12 w-12 ${getStatusColor(query.status).includes('blue') ? 'bg-gradient-to-br from-blue-500 to-blue-600' : getStatusColor(query.status).includes('orange') ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'} rounded-xl flex items-center justify-center shadow-md`}>
                              <span className="text-white font-bold text-lg">{query.student?.fullName?.charAt(0)?.toUpperCase() || 'S'}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-white truncate max-w-md">{query.student?.fullName || 'Unknown Student'}</div>
                              <div className="text-xs text-white/70 mt-1 line-clamp-1 max-w-lg">{query.subject}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(query.status)}`}>
                            <span className="mr-2">{getStatusIcon(query.status)}</span>
                            {query.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-white">{new Date(query.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-white/70">{new Date(query.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <ActionButton icon={FiEye} label="View" onClick={() => handleViewQuery(query)} color="blue" size="sm" />
                            <ActionButton icon={FiMessageCircle} label="Chat" onClick={() => handleOpenChat(query)} color="emerald" size="sm" />
                            <ActionButton icon={FiCheckCircle} label="Resolve" onClick={() => updateQueryStatus(query.id, "resolved")} color="indigo" size="sm" />
                            <ActionButton icon={FiTrash2} label="Delete" onClick={() => setDeleteModalQuery(query)} color="red" size="sm" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiMessageSquare className="text-white/20 text-6xl mb-6 mx-auto" />
                <h3 className="text-xl font-semibold text-white/50 mb-2">No support queries found</h3>
                <p className="text-sm text-white/40">{searchTerm ? 'No queries match your search criteria.' : 'There are no support queries at the moment.'}</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-4">
            {filteredQueries.length > 0 ? (
              <div className="space-y-3">
                {filteredQueries.map((query) => (
                  <div key={query.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-150">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 h-12 w-12 ${getStatusColor(query.status).includes('blue') ? 'bg-gradient-to-br from-blue-500 to-blue-600' : getStatusColor(query.status).includes('orange') ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'} rounded-xl flex items-center justify-center shadow-md`}>
                        <span className="text-white font-bold text-lg">{query.student?.fullName?.charAt(0)?.toUpperCase() || 'S'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{query.student?.fullName || "Unknown Student"}</div>
                            <div className="text-xs text-white/70 mt-1 truncate">{query.subject}</div>
                          </div>
                          <div className="text-right ml-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-xl text-sm font-semibold ${getStatusColor(query.status)}`}>
                              {getStatusIcon(query.status)}
                              <span className="ml-1">{query.status.charAt(0).toUpperCase()}</span>
                            </span>
                            <div className="text-xs text-white/70 mt-2">{new Date(query.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <ActionButton icon={FiEye} label="View" onClick={() => handleViewQuery(query)} color="blue" size="xs" />
                          <ActionButton icon={FiMessageCircle} label="Chat" onClick={() => handleOpenChat(query)} color="emerald" size="xs" />
                          <ActionButton icon={FiCheckCircle} label="Resolve" onClick={() => updateQueryStatus(query.id, "resolved")} color="indigo" size="xs" />
                          <ActionButton icon={FiTrash2} label="Delete" onClick={() => setDeleteModalQuery(query)} color="red" size="xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiMessageSquare className="text-white/20 text-5xl mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-white/50 mb-1">No support queries found</h3>
                <p className="text-sm text-white/40">{searchTerm ? 'No queries match your search criteria.' : 'There are no support queries at the moment.'}</p>
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
    <label className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
      {icon}
      {label}
    </label>
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-sm font-medium text-white break-words">{value || "N/A"}</p>
    </div>
  </div>
);

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="group bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-md transition-all duration-200">
    <div className="flex items-center">
      <div className={`p-3 ${color} rounded-xl shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div> 
      <div className="ml-4">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-extrabold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, color, size = "lg" }) => {
  const sizeMap = {
    lg: { px: "px-4 py-2 text-sm", icon: "w-4 h-4" },
    sm: { px: "px-3 py-1 text-xs", icon: "w-4 h-4" },
    xs: { px: "px-2 py-1 text-xs", icon: "w-3 h-3" }
  };
  const s = sizeMap[size] || sizeMap.lg;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${s.px} bg-white/8 text-white rounded-xl font-semibold transition-all duration-150 border border-white/10 hover:bg-white/12`}
    >
      <Icon className={s.icon} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

export default SupportManager;
