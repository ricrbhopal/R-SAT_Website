// src/pages/QueriesPage.jsx
import React, { useEffect, useState } from "react";
import { AuthAPI } from "../../config/api"; // use AuthAPI directly (it has SubmitSupportQuery & GetStudentSupportQueries)
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

  useEffect(() => {
    fetchQueries();
    return () => {
      if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url);
    };
    // eslint-disable-next-line
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await AuthAPI.GetStudentSupportQueries();
      // backend returns array (or older code may return object); normalize:
      const data = Array.isArray(res.data) ? res.data : (res.data?.queries || []);
      setQueries(data);
    } catch (err) {
      console.error("fetchQueries error:", err);
      if (err.response?.status === 401) {
        toast.error("Unauthorized. Please log in to view your queries.");
      } else {
        toast.error(err.response?.data?.message || "Failed to load support queries");
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
      const created = res.data?.query || res.data; // tolerate either shape
      if (created) setQueries((prev) => [created, ...prev]);
      setNewQuery({ subject: "", description: "" });
      setShowNewQueryForm(false);
    } catch (err) {
      console.error("submit error:", err);
      toast.error(err.response?.data?.message || "Failed to submit query");
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

  const getStatusIcon = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in progress":
      case "in_progress": return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case "open": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved": return "bg-green-50 text-green-700 border-green-200";
      case "in progress":
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-200";
      case "open": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
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
              <button onClick={fetchQueries} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
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
                    <input type="text" value={newQuery.subject} onChange={(e) => setNewQuery({ ...newQuery, subject: e.target.value })} className="w-full px-4 py-3 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={newQuery.description} onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })} className="w-full px-4 py-3 border rounded-lg min-h-[140px]" required />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowNewQueryForm(false)} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
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
                  <select value={imageForm.subject} onChange={(e) => setImageForm((s) => ({ ...s, subject: e.target.value }))} className="w-full px-4 py-3 border rounded-lg">
                    <option value="">Select a subject</option>
                    <option value="Admit Card">Admit Card</option>
                    <option value="Result">Result</option>
                    <option value="Demo">Demo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea value={imageForm.message} onChange={(e) => setImageForm((s) => ({ ...s, message: e.target.value }))} rows="4" className="w-full px-4 py-3 border rounded-lg" />
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
                  <button type="button" onClick={resetImageForm} className="flex-1 px-4 py-3 border rounded-lg">Reset Form</button>
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
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
              ) : queries.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No queries yet</h3>
                  <p className="text-gray-500 mt-2">Submit your first query to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[515px] overflow-y-auto">
                  {queries.map((q) => (
                    <div key={q.id || q._id} className="bg-gray-50 rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm">{q.subject}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(q.status)}`}>
                          {getStatusIcon(q.status)} <span className="capitalize">{q.status || "Unknown"}</span>
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{q.description}</p>

                      {q.imageUrl && <div className="mb-3"><img src={q.imageUrl} alt="attachment" className="h-20 w-full object-cover rounded-lg" /></div>}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(q.createdAt).toLocaleDateString()}</div>
                        <button onClick={() => navigator.clipboard?.writeText(q.id || q._id)} className="hover:text-gray-700">
                          <FileText className="w-3 h-3" />
                        </button>
                      </div>

                      {q.responses && q.responses.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs font-medium mb-2">
                            <MessageSquare className="w-3 h-3" />
                            {q.responses.length} response{q.responses.length !== 1 ? "s" : ""}
                          </div>
                          <div className="space-y-2">
                            {q.responses.slice(0, 1).map((r, idx) => (
                              <div key={idx} className="text-xs text-gray-600 bg-white rounded-lg p-2 border">
                                <p className="line-clamp-2">{r.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueriesPage;
