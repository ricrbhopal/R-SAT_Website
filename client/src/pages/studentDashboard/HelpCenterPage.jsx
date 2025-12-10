// src/pages/QueriesPage.jsx
import React, { useEffect, useState } from "react";
import { AuthAPI } from "../../config/api"; // ensure AddSupportQueryResponse exists or fallback will be used
import { toast } from "react-toastify";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  FileText,
  X,
  Image as ImageIcon,
} from "lucide-react";

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

  useEffect(() => {
    fetchQueries();
    // Auto-refresh every 10 seconds to get admin responses in real-time
    const interval = setInterval(fetchQueries, 10000);
    return () => {
      clearInterval(interval);
      if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    };
    // eslint-disable-next-line
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

    try {
      // Optimistically add message to the UI before sending
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
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

      // Send to server
      const apiCall = AuthAPI.AddSupportQueryResponse
        ? AuthAPI.AddSupportQueryResponse
        : (id, msg) => AuthAPI.post(`/student/add-response/${id}`, { message: msg });

      const response = await apiCall(queryId, text);

      // Update with actual response from server
      if (response?.data?.query) {
        setSelectedChatQuery(prev => ({
          ...prev,
          ...response.data.query,
          responses: response.data.query.responses || []
        }));
      } else {
        // Fallback: fetch latest queries
        await fetchQueries();
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
  };

  const getStatusIcon = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in progress":
      case "in_progress":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case "open":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
                <MessageSquare className="w-8 h-8 text-blue-600" />
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
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
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
                    <X className="w-5 h-5" />
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
                      <Send className="w-4 h-4 inline mr-2" /> {submitting ? "Submitting..." : "Submit Query"}
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
                      <ImageIcon className="w-8 h-8 text-gray-400" />
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
                          <X className="w-4 h-4" />
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
                    <Send className="w-4 h-4 inline mr-2" /> {submitting ? "Submitting..." : "Submit with Attachment"}
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
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                            <Clock className="w-3 h-3" />
                            {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ""}
                          </div>
                          <button onClick={() => navigator.clipboard?.writeText(qid)} className="hover:text-gray-700">
                            <FileText className="w-3 h-3" />
                          </button>
                        </div>

                        {responses && responses.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <button
                              onClick={() => setSelectedChatQuery({ ...q, messageInput: "" })}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedChatQuery.subject}</h3>
                <p className="text-xs text-blue-100">Support Chat</p>
              </div>
              <button
                onClick={() => setSelectedChatQuery(null)}
                className="p-2 hover:bg-blue-500 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {/* Initial Query */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-3xl rounded-tr-sm px-4 py-3 max-w-xs">
                  <p className="text-sm break-words">{selectedChatQuery.description}</p>
                  <p className="text-xs mt-2 text-blue-100">{new Date(selectedChatQuery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* All Responses - Both Student and Admin */}
              {selectedChatQuery.responses && selectedChatQuery.responses.length > 0 && selectedChatQuery.responses
                .map((response, idx) => {
                  const isStudent = response.senderType === "STUDENT";
                  return (
                    <div key={response.id || idx} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                      <div className={`rounded-3xl px-4 py-3 max-w-xs ${
                        isStudent 
                          ? "bg-blue-600 text-white rounded-tr-sm" 
                          : "bg-gray-200 text-gray-900 rounded-tl-sm"
                      }`}>
                        {!isStudent && (
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            {response.responder || "Support Team"}
                          </p>
                        )}
                        <p className="text-sm break-words">{response.message}</p>
                        <p className={`text-xs mt-2 ${isStudent ? "text-blue-100" : "text-gray-500"}`}>
                          {new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 flex items-end gap-3">
              <input
                type="text"
                value={selectedChatQuery.messageInput || ""}
                onChange={(e) => setSelectedChatQuery(prev => ({ ...prev, messageInput: e.target.value }))}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
              />
              <button
                onClick={sendChatMessage}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueriesPage;
