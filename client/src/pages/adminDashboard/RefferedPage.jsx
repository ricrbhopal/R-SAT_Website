// src/pages/ReferredPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AdminAPI } from "../../config/api.js";

const PageSizeOptions = [10, 25, 50, 100];

function normalizeRow(row) {
  const r = { ...(row || {}) };

  let ref = r.referrerId ?? r.referrer ?? null;

  if (!ref || typeof ref === "string") {
    ref = {
      fullName: r.fullName ?? r.referrerName ?? r.referrerFullName ?? null,
      student_ID:
        r.referrerStudentID ??
        r.referrerStudentId ??
        r.student_ID ??
        r.studentId ??
        null,
      mail_ID: r.referrerEmail ?? r.referrerMail ?? r.mail_ID ?? r.email ?? null,
      phoneNo:
        r.referrerPhone ??
        r.referrerPhoneNo ??
        r.phoneNo ??
        r.phone ??
        null,
      _id: r.referrerUserId ?? null,
    };
  } else {
    ref = {
      fullName: ref.fullName ?? ref.name ?? ref.fullname ?? null,
      student_ID: ref.student_ID ?? ref.studentId ?? ref.student ?? null,
      mail_ID: ref.mail_ID ?? ref.mail ?? ref.email ?? null,
      phoneNo: ref.phoneNo ?? ref.phone ?? ref.phone_number ?? null,
      _id: ref._id ?? ref.id ?? null,
      ...ref,
    };
  }

  r.referrerId = ref;

  r.referredName = r.referredName ?? r.fullName ?? r.name ?? "";
  r.referredEmail = r.referredEmail ?? r.mail_ID ?? r.email ?? "";
  r.referredPhone = r.referredPhone ?? r.phoneNo ?? r.phone ?? "";
  r.collegeName = r.collegeName ?? r.college ?? "";
  r.year = r.year ?? r.academicYear ?? "";
  r.refCode = r.refCode ?? r.referralCode ?? "";
  r.referredDate = r.referredDate ?? r.createdAt ?? null;

  return r;
}

export default function ReferredPage() {
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [candidatePageBlocked, setCandidatePageBlocked] = useState(() => {
    return localStorage.getItem("candidatePageBlocked") === "true";
  });

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

  const fetchReferredUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, q: query };
      const response = await AdminAPI.getRefferedUsers(params);
      console.log("Fetched raw resp:", response);

      // Ensure the data is extracted correctly
      if (response && response.data) {
        setReferredUsers(response.data); // Update state with the data array
        setTotal(response.total || response.data.length); // Update total count
      } else {
        setReferredUsers([]); // Fallback to empty array if no data
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to fetch referred users", err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidatePageStatus = () => {
    const newStatus = !candidatePageBlocked;
    setCandidatePageBlocked(newStatus);
    localStorage.setItem("candidatePageBlocked", newStatus);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };
  const handleEdit = (user) => {
    alert(`Edit functionality for: ${user.referredName || user.referredEmail}`);
  };
  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.referredName || user.referredEmail}?`)) {
      alert(`Delete functionality for: ${user.referredName || user.referredEmail}`);
    }
  };

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
      "Referred On": new Date(r.referredDate ?? r.createdAt ?? Date.now()).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referred");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `referred_export_page${page}.xlsx`);
  };

  const lastPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const stats = useMemo(() => {
    const totalReferrals = total;
    const today = new Date().toDateString();
    const todayReferrals = referredUsers.filter((user) =>
      new Date(user.referredDate ?? user.createdAt).toDateString() === today
    ).length;
    return { totalReferrals, todayReferrals };
  }, [total, referredUsers]);

  console.log("Referred Users State:", referredUsers); // Debugging log to verify state

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Referral Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage and track all student referrals in one place</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${candidatePageBlocked ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></div>
                <span className="text-sm font-semibold text-gray-700">
                  Candidate Page: {candidatePageBlocked ? "Blocked" : "Active"}
                </span>
                <button
                  onClick={toggleCandidatePageStatus}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${candidatePageBlocked ? "bg-red-600" : "bg-green-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${candidatePageBlocked ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

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




      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-10">
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
              {loading && referredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-700">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <div>Loading…</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && referredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-red-600">
                      <p className="text-lg font-semibold">{error}</p>
                      <button onClick={fetchReferredUsers} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && referredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-500">
                      <p className="text-lg font-semibold">No referral records found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}

              {referredUsers.length > 0 &&
                referredUsers.map((r, idx) => {
                  const referrer = r.referrerId ?? {};
                  const idxNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r._id ?? idx} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {idxNumber}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">{((referrer.fullName ?? r.fullName ?? "?") + "").charAt(0)}</span>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 text-lg">{referrer.fullName ?? r.fullName ?? "-"}</p>
                            <p className="text-sm text-gray-500 mt-1">{referrer.student_ID ? `ID: ${referrer.student_ID}` : ""}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">{((r.referredName ?? "?") + "").charAt(0)}</span>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900 text-lg">{r.referredName ?? "-"}</p>
                            <p className="text-sm text-gray-500 mt-1">{r.collegeName ?? ""}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleViewDetails(r)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 group" title="View Details">
                            View
                          </button>

                          <button onClick={() => handleEdit(r)} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-105 group" title="Edit">
                            Edit
                          </button>

                          <button onClick={() => handleDelete(r)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all duration-300 transform hover:scale-105 group" title="Delete">
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-gray-200 bg-gray-50/50">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-bold text-gray-900">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="font-bold text-gray-900">{total}</span> results
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium">
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${page === pageNum ? "bg-blue-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                    {pageNum}
                  </button>
                );
              })}
              {lastPage > 5 && <span className="px-2 text-gray-500">...</span>}
            </div>

            <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium">
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform">
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Referral Details</h2>
                <p className="text-gray-600">Complete information about the referral</p>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors duration-300">Close</button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Referrer Information</h3>
                  <DetailItem label="Full Name" value={selectedUser.referrerId?.fullName ?? selectedUser.fullName ?? "-"} />
                  <DetailItem label="Student ID" value={selectedUser.referrerId?.student_ID ?? selectedUser.referrerStudentID ?? "-"} />
                  <DetailItem label="Email" value={selectedUser.referrerId?.mail_ID ?? "-"} />
                  <DetailItem label="Phone" value={selectedUser.referrerId?.phoneNo ?? "-"} />
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Referred Information</h3>
                  <DetailItem label="Full Name" value={selectedUser.referredName ?? "-"} />
                  <DetailItem label="Email" value={selectedUser.referredEmail ?? "-"} />
                  <DetailItem label="Phone" value={selectedUser.referredPhone ?? "-"} />
                  <DetailItem label="College" value={selectedUser.collegeName ?? "-"} />
                  <DetailItem label="Academic Year" value={selectedUser.year ?? "-"} />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <DetailItem label="Referral Code" value={selectedUser.refCode ?? "-"} />
                  <DetailItem label="Referred On" value={new Date(selectedUser.referredDate ?? selectedUser.createdAt ?? Date.now()).toLocaleString()} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-8 border-t border-gray-200">
              <button onClick={handleCloseModal} className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-gray-50/50 rounded-2xl p-4">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg text-gray-900 mt-2 font-medium">{value}</p>
    </div>
  );
}
