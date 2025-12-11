// src/pages/QueriesPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { AuthAPI } from "../../config/api"; // ensure AddSupportQueryResponse exists or fallback will be used
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import {
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSend,
  FiFileText,
  FiX,
  FiImage,
  FiLock,
} from "react-icons/fi";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:6501";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const IMAGE_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

const QueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuery, setNewQuery] = useState({ subject: "", description: "" });
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);

  const [imageForm, setImageForm] = useState({ subject: "", message: "", image: null });
  const [imagePreview, setImagePreview] = useState(null);

  const [selectedChatQuery, setSelectedChatQuery] = useState(null);
  const socketRef = useRef(null);
  const chatQueryRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchQueries();
    // Remove auto-refresh interval - use websocket instead
    return () => {
      if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    chatQueryRef.current = selectedChatQuery;
    // Lock/unlock body scroll based on modal state
    if (selectedChatQuery) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedChatQuery]);

  useEffect(() => {
    // Auto-scroll to latest message when chat updates
    if (selectedChatQuery && selectedChatQuery.responses?.length && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatQuery?.responses?.length, selectedChatQuery]);

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
      console.log("[socket] student connected", socket.id);
      toast.success("Connected to support server", { autoClose: 2000 });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] student disconnected", reason);
      if (reason === "io server disconnect") {
        socket.connect();
      }
      toast.warning("Disconnected from server", { autoClose: 2000 });
    });

    socket.on("connect_error", (error) => {
      console.error("[socket] connection error", error);
    });

    socket.on("support_message", ({ queryId, responses, query, clientMessageId }) => {
      // Update queries list
      if (query) {
        setQueries((prev) => prev.map((q) => (q.id === query.id ? { ...q, ...query, responses: query.responses || q.responses } : q)));
      }

      // Update chat modal if open for this query
      if (chatQueryRef.current?.id === queryId) {
        const updatedResponses = responses || query?.responses || [];
        setSelectedChatQuery((prev) => (prev ? { ...prev, ...(query || {}), responses: updatedResponses, messageInput: prev.messageInput } : prev));
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
      const res = await AuthAPI.GetStudentSupportQueries();
      // normalize response: frontend expects array directly
      const data = Array.isArray(res.data) ? res.data : (res.data?.queries || []);
      setQueries(data);
    } catch (err) {
      console.error("fetchQueries error:", err);
      if (err?.response?.status === 401) {
        toast.error("Unauthorized. Please log in to view your queries.");
      } else {
        toast.error(err?.response?.data?.message || "Failed to load support queries");
      }
    } finally {
      setLoading(false);
    }
  };

  // New JSON query (no image)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuery.subject.trim() || !newQuery.description.trim()) {
      toast.error("Please fill subject and description");
      return;
    }
    setSubmitting(true);
    try {
      const res = await AuthAPI.SubmitSupportQuery(newQuery);
      toast.success(res.data?.message || "Query submitted successfully!");
      const created = res.data?.query || res.data;
      if (created) setQueries((prev) => [created, ...prev]);
      setNewQuery({ subject: "", description: "" });
      setShowNewQueryForm(false);
    } catch (err) {
      console.error("submit error:", err);
      toast.error(err?.response?.data?.message || "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  // Image handlers
  const handleImageInput = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
      setImageForm((s) => ({ ...s, image: null }));
      return;
    }
    if (!IMAGE_MIME.includes(file.type)) {
      toast.error("Only image files allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Image exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    setImagePreview({ name: file.name, size: file.size, url });
    setImageForm((s) => ({ ...s, image: file }));
  };

  const removeSelectedImage = () => {
    if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    setImagePreview(null);
    setImageForm((s) => ({ ...s, image: null }));
  };

  const resetImageForm = () => {
    removeSelectedImage();
    setImageForm({ subject: "", message: "", image: null });
  };

  const handleImageFormSubmit = async (e) => {
    e.preventDefault();
    if (!imageForm.subject?.trim() || !imageForm.message?.trim()) {
      toast.error("Please provide subject and message");
      return;
    }
    const fd = new FormData();
    fd.append("subject", imageForm.subject);
    fd.append("description", imageForm.message);
    if (imageForm.image) fd.append("image", imageForm.image);

    try {
      setSubmitting(true);
      const res = await AuthAPI.SubmitSupportQuery(fd);
      toast.success(res.data?.message || "Support request submitted");
      const created = res.data?.query || res.data;
      if (created) setQueries((prev) => [created, ...prev]);
      resetImageForm();
    } catch (err) {
      console.error("submit error:", err);
      toast.error(err?.response?.data?.message || "Failed to submit support request");
    } finally {
      setSubmitting(false);
    }
  };

  // send message in chat
  const sendChatMessage = async () => {
    const queryId = selectedChatQuery?.id;
    const text = String(selectedChatQuery?.messageInput || "").trim();
    
    if (!text) {
      toast.error("Please enter a message");
      return;
    }

    const clientMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: clientMessageId,
      queryId,
      senderType: "STUDENT",
      senderId: selectedChatQuery?.studentId,
      responder: "You",
      message: text,
      createdAt: new Date().toISOString()
    };

    // Update UI immediately
    setSelectedChatQuery(prev => ({
      ...prev,
      responses: [...(prev.responses || []), optimisticMessage],
      messageInput: ""
    }));

    // Try websocket first
    if (socketRef.current) {
      socketRef.current.emit("support_message", {
        queryId,
        message: text,
        senderType: "STUDENT",
        responder: selectedChatQuery?.student?.fullName || "You",
        clientMessageId,
      });
    } else {
      // Fallback to HTTP if websocket unavailable
      try {
        const apiCall = AuthAPI.AddSupportQueryResponse
          ? AuthAPI.AddSupportQueryResponse
          : (id, msg) => AuthAPI.post(`/student/add-response/${id}`, { message: msg });

        const response = await apiCall(queryId, text);

        // Update with actual response from server
        if (response?.data?.query) {
          const updatedQuery = response.data.query;
          setSelectedChatQuery(prev => ({
            ...prev,
            ...updatedQuery,
            responses: updatedQuery.responses || []
          }));
          // Update queries list
          setQueries((prev) => prev.map((q) => (q.id === queryId ? { ...q, ...updatedQuery } : q)));
        }
        
        toast.success("Message sent");
      } catch (err) {
        console.error("sendChatMessage error:", err);
        // Remove optimistic message on error
        setSelectedChatQuery(prev => ({
          ...prev,
          responses: (prev.responses || []).filter(r => !r.id.startsWith('temp-'))
        }));
        toast.error(err?.response?.data?.message || "Failed to send message");
      }
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved":
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case "in progress":
      case "in_progress":
        return <FiRefreshCw className="w-4 h-4 text-blue-600" />;
      case "open":
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FiAlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "in progress":
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "open":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiMessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-2">Get help with your questions and issues</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchQueries}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {showNewQueryForm && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Create New Query</h2>
                  <button onClick={() => setShowNewQueryForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={newQuery.subject}
                      onChange={(e) => setNewQuery({ ...newQuery, subject: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newQuery.description}
                      onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg min-h-[140px]"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowNewQueryForm(false)} className="flex-1 px-4 py-3 border rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">
                      <FiSend className="w-4 h-4 inline mr-2" /> {submitting ? "Submitting..." : "Submit Query"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-6">Submit Query with Attachment</h2>
              <form onSubmit={handleImageFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={imageForm.subject}
                    onChange={(e) => setImageForm((s) => ({ ...s, subject: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Select a subject</option>
                    <option value="Admit Card">Admit Card</option>
                    <option value="Result">Result</option>
                    <option value="Demo">Demo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={imageForm.message}
                    onChange={(e) => setImageForm((s) => ({ ...s, message: e.target.value }))}
                    rows="4"
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Image (Optional)</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageInput} className="hidden" />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <FiImage className="w-8 h-8 text-gray-400" />
                      <div className="text-sm text-gray-600">Click to upload an image (PNG, JPG, GIF up to 10MB)</div>
                    </label>
                  </div>

                  {imagePreview && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <img src={imagePreview.url} alt={imagePreview.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{imagePreview.name}</p>
                          <p className="text-sm text-gray-500">{(imagePreview.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button type="button" onClick={removeSelectedImage} className="p-2 text-gray-400 hover:text-red-500">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={resetImageForm} className="flex-1 px-4 py-3 border rounded-lg">
                    Reset Form
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">
                    <FiSend className="w-4 h-4 inline mr-2" /> {submitting ? "Submitting..." : "Submit with Attachment"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Your Queries</h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{queries.length}</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : queries.length === 0 ? (
                <div className="text-center py-12">
                  <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No queries yet</h3>
                  <p className="text-gray-500 mt-2">Submit your first query to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[515px] overflow-y-auto">
                  {queries.map((q) => {
                    const qid = q.id || q._id;
                    const responses = Array.isArray(q.responses) ? q.responses : [];
                    return (
                      <div key={qid} className="bg-gray-50 rounded-xl border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-sm">{q.subject}</h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              q.status
                            )}`}
                          >
                            {getStatusIcon(q.status)} <span className="capitalize">{q.status || "Unknown"}</span>
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{q.description}</p>

                        {q.imageUrl && (
                          <div className="mb-3">
                            <img src={q.imageUrl} alt="attachment" className="h-20 w-full object-cover rounded-lg" />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ""}
                          </div>
                          <button onClick={() => navigator.clipboard?.writeText(qid)} className="hover:text-gray-700">
                            <FiFileText className="w-3 h-3" />
                          </button>
                        </div>

                        {responses && responses.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <button
                              onClick={() => {
                                setSelectedChatQuery({ ...q, messageInput: "" });
                                if (socketRef.current) {
                                  socketRef.current.emit("join_support", { queryId: q.id });
                                }
                              }}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                              <FiMessageSquare className="w-4 h-4" />
                              {responses.length} Message{responses.length !== 1 ? "s" : ""} - Open Chat
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp-Style Chat Modal */}
  {selectedChatQuery && (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden border border-gray-300/30">
      {/* Chat Header - Modern Glass Effect */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
            <FiMessageSquare className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight truncate">{selectedChatQuery.subject}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Support • Active now</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedChatQuery(null)}
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90 hover:scale-110 group"
        >
          <FiX className="w-6 h-6 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Messages Area - Elegant Scroll */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 via-white to-gray-50 space-y-6">
        {/* Date Separator */}
        <div className="text-center my-4">
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-4 py-1.5 rounded-full">
            {new Date(selectedChatQuery.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Initial Query */}
        <div className="flex justify-end animate-slideInRight">
          <div className="relative max-w-md">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-none px-5 py-4 shadow-xl transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-200">You</span>
                <span className="text-xs text-blue-300">
                  {new Date(selectedChatQuery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm leading-relaxed break-words">{selectedChatQuery.description}</p>
            </div>
            <div className="absolute right-0 top-0 w-4 h-4 overflow-hidden">
              <div className="absolute w-8 h-8 bg-blue-600 -right-4 -top-4 rotate-45"></div>
            </div>
          </div>
        </div>

        {/* All Responses */}
        {selectedChatQuery.responses && selectedChatQuery.responses.length > 0 && selectedChatQuery.responses
          .map((response, idx) => {
            const isStudent = response.senderType === "STUDENT";
            return (
              <div key={response.id || idx} className={`flex ${isStudent ? "justify-end" : "justify-start"} animate-slideIn`}>
                <div className={`relative max-w-md transform transition-all duration-300 hover:translate-y-[-2px] ${
                  isStudent ? 'hover:shadow-blue-200/30' : 'hover:shadow-gray-200/30'
                }`}>
                  {!isStudent && (
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {response.responder ? response.responder.charAt(0).toUpperCase() : "S"}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {response.responder || "Support Team"}
                      </span>
                    </div>
                  )}
                  
                  <div className={`rounded-2xl px-5 py-4 shadow-lg ${
                    isStudent 
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none" 
                      : "bg-gradient-to-br from-white to-gray-50 text-gray-900 border border-gray-200/50 rounded-bl-none"
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{response.message}</p>
                    <div className={`flex items-center justify-between mt-3 ${
                      isStudent ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      <div className="text-xs">
                        {isStudent ? 'You' : response.responder?.split(' ')[0] || 'Support'}
                      </div>
                      <div className="text-xs">
                        {new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat bubble tail */}
                  <div className={`absolute w-4 h-4 overflow-hidden ${
                    isStudent 
                      ? 'right-0 top-0' 
                      : 'left-0 top-[calc(2rem+8px)]'
                  }`}>
                    <div className={`absolute w-8 h-8 ${
                      isStudent 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 -right-4 -top-4 rotate-45' 
                        : 'bg-gradient-to-br from-white to-gray-50 border-l border-t border-gray-200/50 -left-4 -top-4 rotate-45'
                    }`}></div>
                  </div>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Floating Glass Effect */}
      <div className="bg-gradient-to-t from-white via-white to-gray-50 border-t border-gray-200/50 p-6">
        <div className="relative">
          <input
            type="text"
            value={selectedChatQuery.messageInput || ""}
            onChange={(e) => setSelectedChatQuery(prev => ({ ...prev, messageInput: e.target.value }))}
            placeholder="Type your message here..."
            className="w-full px-6 py-4 pl-14 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl text-gray-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500 shadow-lg"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
          />
  
          <button
            onClick={sendChatMessage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 shadow-md group"
          >
            <FiSend className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500 px-2">
          <span>Press Enter to send • Shift + Enter for new line</span>
          <span className="flex items-center gap-1">
            <FiLock className="w-4 h-4" />
            End-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default QueriesPage;
