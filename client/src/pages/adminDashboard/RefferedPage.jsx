// ReferredPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AdminAPI } from "../../config/api.js";

const PageSizeOptions = [10, 25, 50, 100];

export default function ReferredPage() {
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // candidate page global toggle
  const [candidatePageBlocked, setCandidatePageBlocked] = useState(() => {
    return localStorage.getItem("candidatePageBlocked") === "true";
  });

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchReferredUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, query, statusFilter]);

  async function fetchReferredUsers() {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: pageSize, q: query, status: statusFilter };
      const resp = await AdminAPI.getRefferedUsers(params);
      console.log("Fetched referred users raw resp:", resp);
console.log(resp.data);
      let rows = [];
      let tot = 0;

      if (!resp) {
        rows = [];
      } else if (Array.isArray(resp)) {
        rows = resp;
      } else if (Array.isArray(resp.data)) {
        rows = resp.data;
        tot = resp.total ?? rows.length;
      } else if (resp.data && Array.isArray(resp.data.data)) {
        rows = resp.data.data;
        tot = resp.data.total ?? rows.length;
      } else if (resp.data && Array.isArray(resp.data.rows)) {
        rows = resp.data.rows;
        tot = resp.data.total ?? resp.data.rows.length;
      } else {
        rows = resp.data ?? [];
        if (typeof resp.total === "number") tot = resp.total;
      }

      if (!Array.isArray(rows)) rows = [];

      if (!mountedRef.current) return;
      setReferredUsers(rows);
      setTotal(Number(tot) || rows.length);
    } catch (err) {
      console.error("Failed to fetch referred users", err);
      if (!mountedRef.current) return;
      setError("Failed to load data. Please try again.");
      setReferredUsers([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const toggleCandidatePageStatus = () => {
    const newStatus = !candidatePageBlocked;
    setCandidatePageBlocked(newStatus);
    localStorage.setItem("candidatePageBlocked", newStatus);
  };

  // View details in modal
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Edit user
  const handleEdit = (user) => {
    console.log("Edit user:", user);
    // Add your edit logic here
    alert(`Edit functionality for: ${user.referredName || user.referredEmail}`);
  };

  // Delete user
  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.referredName || user.referredEmail}?`)) {
      console.log("Delete user:", user);
      // Add your delete logic here
      alert(`Delete functionality for: ${user.referredName || user.referredEmail}`);
    }
  };

  // Exports
  const downloadExcel = () => {
    if (!referredUsers.length) return alert("No data to export");
    const sheetData = referredUsers.map((r) => ({
      "Referrer Student ID": r.referrerId?.student_ID ?? r.referrerStudentID ?? "-",
      "Referrer Name": r.referrerId?.fullName ?? r.fullName ?? "-",
      "Referrer Email": r.referrerId?.mail_ID ?? "-",
      "Referrer Phone": r.referrerId?.phoneNo ?? "-",
      "Referred Name": r.referredName ?? "-",
      "Referred Email": r.referredEmail ?? "-",
      "Referred Phone": r.referredPhone ?? "-",
      College: r.collegeName ?? "-",
      Year: r.year ?? "-",
      "Referral Code": r.refCode ?? "-",
      Status: r.status ?? "-",
      "Referred On": new Date(r.referredDate ?? r.createdAt ?? Date.now()).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referred");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `referred_export_page${page}.xlsx`);
  };

  const lastPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalReferrals = total;
    const today = new Date().toDateString();
    const todayReferrals = referredUsers.filter(user => 
      new Date(user.referredDate ?? user.createdAt).toDateString() === today
    ).length;
    
    return { totalReferrals, todayReferrals };
  }, [total, referredUsers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Referral Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage and track all student referrals in one place
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Candidate Page Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${candidatePageBlocked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm font-semibold text-gray-700">
                  Candidate Page: {candidatePageBlocked ? 'Blocked' : 'Active'}
                </span>
                <button
                  onClick={toggleCandidatePageStatus}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${
                    candidatePageBlocked ? 'bg-red-600' : 'bg-green-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                      candidatePageBlocked ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={downloadExcel}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayReferrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">{page}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Showing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.min(page * pageSize, total)} / {total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, college, phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
              <tr>
                <th className="text-center px-8 py-6 font-bold text-gray-700 text-sm uppercase tracking-wider">#</th>
                <th className="text-center px-8 py-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Referrer</th>
                <th className="text-center px-8 py-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Referred</th>
                <th className="text-center px-8 py-6 font-bold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-8 py-6 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-red-600">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-lg font-semibold">{error}</p>
                      <button
                        onClick={fetchReferredUsers}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : referredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-500">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-semibold">No referral records found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                referredUsers.map((r, idx) => {
                  const referrer = r.referrerId ?? r.referrer ?? {};
                  return (
                    <tr key={r._id ?? idx} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                      {/* Serial Number */}
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {(page - 1) * pageSize + idx + 1}
                        </span>
                      </td>
                      
                      {/* Referrer Column - Only Name */}
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {referrer.fullName?.charAt(0) || r.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 text-lg">
                              {referrer.fullName ?? r.fullName ?? "-"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {referrer.student_ID ? `ID: ${referrer.student_ID}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Referred Column - Only Name */}
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {r.referredName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 text-lg">
                              {r.referredName ?? "-"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {r.collegeName ? r.collegeName : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Actions Column */}
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          {/* View Button */}
                          <button
                            onClick={() => handleViewDetails(r)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 group"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(r)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-105 group"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(r)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-300 transform hover:scale-105 group"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-bold text-gray-900">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-bold text-gray-900">{total}</span> results
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      page === pageNum
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {lastPage > 5 && <span className="px-2 text-gray-500">...</span>}
            </div>
            
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Referral Details</h2>
                  <p className="text-gray-600">Complete information about the referral</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors duration-300"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Referrer Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    Referrer Information
                  </h3>
                  <DetailItem label="Full Name" value={selectedUser.referrerId?.fullName ?? selectedUser.fullName ?? "-"} />
                  <DetailItem label="Student ID" value={selectedUser.referrerId?.student_ID ?? selectedUser.referrerStudentID ?? "-"} />
                  <DetailItem label="Email" value={selectedUser.referrerId?.mail_ID ?? "-"} />
                  <DetailItem label="Phone" value={selectedUser.referrerId?.phoneNo ?? "-"} />
                </div>

                {/* Referred Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-3">
                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                    Referred Information
                  </h3>
                  <DetailItem label="Full Name" value={selectedUser.referredName ?? "-"} />
                  <DetailItem label="Email" value={selectedUser.referredEmail ?? "-"} />
                  <DetailItem label="Phone" value={selectedUser.referredPhone ?? "-"} />
                  <DetailItem label="College" value={selectedUser.collegeName ?? "-"} />
                  <DetailItem label="Branch" value={selectedUser.branch ?? "-"} />
                  <DetailItem label="Academic Year" value={selectedUser.year ?? "-"} />
                  <DetailItem label="Date of Birth" value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : "-"} />
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem label="Referral Code" value={selectedUser.refCode ?? "-"} />
                  <DetailItem 
                    label="Referred On" 
                    value={new Date(selectedUser.referredDate ?? selectedUser.createdAt ?? Date.now()).toLocaleString()} 
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 p-8 border-t border-gray-200 bg-gray-50/50 rounded-b-3xl">
              <button
                onClick={handleCloseModal}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for detail items in modal
function DetailItem({ label, value }) {
  return (
    <div className="bg-gray-50/50 rounded-2xl p-4 hover:bg-gray-100/50 transition-colors duration-300">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg text-gray-900 mt-2 font-medium">{value}</p>
    </div>
  );
}