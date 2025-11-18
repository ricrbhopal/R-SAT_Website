import React, { useEffect, useState } from "react";
import { SupportAPI } from "../../config/api";
import { toast } from "react-toastify";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  FileText,
} from "lucide-react";

const QueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuery, setNewQuery] = useState({ subject: "", description: "" });
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await SupportAPI.GetStudentSupportQueries();
      setQueries(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized. Please log in to view your queries.");
      } else {
        toast.error(err.response?.data?.message || "Failed to load support queries");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuery.subject.trim() || !newQuery.description.trim()) {
      toast.error("Please fill subject and description");
      return;
    }
    setSubmitting(true);
    try {
      const res = await SupportAPI.SubmitSupportQuery(newQuery);
      toast.success(res.data.message || "Query submitted successfully!");
      setQueries((prev) => [res.data.query, ...prev]);
      setNewQuery({ subject: "", description: "" });
      setShowNewQueryForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-800" />;
      case "in progress":
        return <RefreshCw className="w-4 h-4 text-blue-800" />;
      case "open":
        return <Clock className="w-4 h-4 text-yellow-800" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 text-sm">Get help with your questions and issues</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewQueryForm((s) => !s)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                aria-expanded={showNewQueryForm}
              >
                <Plus className="w-4 h-4" />
                <span>New Query</span>
              </button>

              <button
                onClick={fetchQueries}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-transparent hover:border-gray-200 transition text-sm"
                aria-label="Refresh queries"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* New Query Form (collapsible) */}
        <div className={`${showNewQueryForm ? "block" : "hidden"} mb-6`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newQuery.subject}
                  onChange={(e) => setNewQuery({ ...newQuery, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                <textarea
                  value={newQuery.description}
                  onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none min-h-[120px]"
                  placeholder="Please provide detailed information about your issue"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewQueryForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Submitting..." : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Queries list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No support queries yet</h3>
              <p className="text-gray-600 mb-4">Submit your first query to get help from our support team</p>
              <button
                onClick={() => setShowNewQueryForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            queries.map((q) => (
              <article
                key={q._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{q.subject}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{q.description}</p>
                    </div>

                    <div className="flex-shrink-0 flex items-start sm:items-center gap-2">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(q.status)}`}>
                        {getStatusIcon(q.status)}
                        <span className="capitalize">{q.status || 'Unknown'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500 flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      {q.createdAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}

                      {q.updatedAt && q.updatedAt !== q.createdAt && (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          <span>Updated: {new Date(q.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard?.writeText(q._id) || null}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        title="Copy ticket id"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Responses */}
                {q.responses && q.responses.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-4 sm:p-6 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Support Responses ({q.responses.length})
                      </h4>

                      <div className="space-y-3">
                        {q.responses.map((r, idx) => (
                          <div key={idx} className="bg-white rounded-md border border-gray-200 p-3">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">{r.responder || 'Support'}</span>
                              <span className="text-xs text-gray-500">{new Date(r.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QueriesPage;
