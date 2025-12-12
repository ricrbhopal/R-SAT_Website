// src/components/StudentsTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ManagerAPI } from "../../../config/api";
import { toast } from "react-toastify";

/* ---------------------- Helpers ---------------------- */
const compareValues = (a, b, order = "asc") => {
  if (a == null) a = "";
  if (b == null) b = "";
  const A = typeof a === "string" ? a.toLowerCase() : a;
  const B = typeof b === "string" ? b.toLowerCase() : b;
  if (A > B) return order === "asc" ? 1 : -1;
  if (A < B) return order === "asc" ? -1 : 1;
  return 0;
};

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleString();
}

/* ---------------------- Main Component ---------------------- */
export default function StudentsTable({ initialData = [] }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sortField, setSortField] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedRow, setSelectedRow] = useState(null);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // fetch real data from backend
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    ManagerAPI.getAllUsers()
      .then((res) => {
        if (!mounted) return;
        const users = res?.data || [];
        setData(users);
      })
      .catch((err) => {
        console.error("ManagerAPI.getAllUsers error:", err);
        toast.error("Failed to load students from server");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // processed
  const processed = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    let filtered = data.filter((r) => {
      if (!q) return true;
      return (
        (r.fullName || "").toString().toLowerCase().includes(q) ||
        (r.mail_ID || "").toString().toLowerCase().includes(q) ||
        (r.phoneNo || "").toString().toLowerCase().includes(q) ||
        (r.college || "").toString().toLowerCase().includes(q) ||
        (r.branch || "").toString().toLowerCase().includes(q) ||
        (r.student_ID || "").toString().toLowerCase().includes(q)
      );
    });

    filtered.sort((a, b) => {
      const aVal = sortField.includes(".")
        ? sortField.split(".").reduce((o, k) => (o ? o[k] : null), a)
        : a[sortField];
      const bVal = sortField.includes(".")
        ? sortField.split(".").reduce((o, k) => (o ? o[k] : null), b)
        : b[sortField];
      return compareValues(aVal, bVal, sortOrder);
    });

    return filtered;
  }, [data, debouncedQuery, sortField, sortOrder]);

  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageData = processed.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Top bar */}
      <div className="mb-6 rounded-2xl bg-slate-900/90 px-6 py-5 shadow-md border border-slate-800/80 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Student Records</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor registrations, admit-cards, demo slots, referrals and queries.
            </p>
          </div>
            <div className="flex gap-2 items-center">
            <div className="text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-md border border-slate-700/70 shadow-sm">
              Total Students: <span className="font-medium text-slate-50 ml-1">{data.length}</span>
            </div>
            <div className="text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-md border border-slate-700/70 shadow-sm hidden sm:block">
              Admit Cards: <span className="font-medium text-slate-50 ml-1">{data.filter((d) => d.admitCards?.length > 0).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, college..."
              className="w-80 rounded-lg border border-slate-700/70 bg-slate-900/95 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/70 transition-all duration-200 shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">⌘K</div>
          </div>
          <div className="text-sm text-slate-400">Results: <span className="font-medium text-slate-100">{total}</span></div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Rows per page</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-slate-700/70 bg-slate-900/95 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-sm"
          >
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800/50 table-fixed">
            <thead className="bg-slate-900/80">
              <tr>
                <Th>Name</Th>
                <Th sortable onClick={() => handleSort("phone")} active={sortField === "phone"} order={sortOrder}>
                  Phone
                </Th>
                <Th sortable onClick={() => handleSort("email")} active={sortField === "email"} order={sortOrder}>
                  Email
                </Th>
                <Th>College</Th>
                <Th>Branch</Th>
                <Th sortable onClick={() => handleSort("year")} active={sortField === "year"} order={sortOrder}>
                  Year
                </Th>
                <Th sortable onClick={() => handleSort("createdAt")} active={sortField === "createdAt"} order={sortOrder}>
                  Submitted
                </Th>
                <Th center>Admit</Th>
                <Th center>Result</Th>
                <Th center>Demo</Th>
                <Th center>Queries</Th>
              </tr>
            </thead>

            <tbody className="bg-slate-950/90 divide-y divide-slate-800/50">
              {pageData.map((row) => (
                <tr
                  key={row.id || row._id}
                  onClick={() => setSelectedRow(row)}
                  className="cursor-pointer transition-all duration-150 hover:bg-slate-900/80 hover:shadow-md hover:border-slate-700/50 border border-transparent hover:border"
                >
                  <Td>{row.fullName ?? "-"}</Td>
                  <Td>{row.phoneNo ?? "-"}</Td>
                  <Td className="truncate max-w-[200px]">{row.mail_ID ?? "-"}</Td>
                  <Td className="max-w-[180px] truncate">{row.college ?? "-"}</Td>
                  <Td>{row.branch ?? "-"}</Td>
                  <Td>{row.year ?? "-"}</Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(row.createdAt)}</Td>

                  <Td center>
                    <StatusPill ok={row.admitCards?.length > 0} />
                  </Td>

                  <Td center>
                    <StatusPill ok={row.results?.length > 0} />
                  </Td>

                  <Td center>
                    <StatusPill ok={row.demos?.length > 0} />
                  </Td>

                  <Td center>
                    <span className="inline-flex items-center rounded-full bg-indigo-900/60 px-2.5 py-1 text-xs font-medium text-indigo-300 border border-indigo-700/50 shadow-sm">
                      {row.supportQueries?.length ?? 0}
                    </span>
                  </Td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-slate-400">
                    No records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-slate-400">
        <div className="text-sm">
          Showing{" "}
          <strong className="text-slate-100">{total === 0 ? 0 : (page - 1) * pageSize + 1}</strong> -{" "}
          <strong className="text-slate-100">{Math.min(page * pageSize, total)}</strong> of{" "}
          <strong className="text-slate-100">{total}</strong> students
        </div>

        <div className="flex items-center gap-1">
          <Pager onClick={() => setPage(1)} disabled={page === 1}>
            « First
          </Pager>
          <Pager onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ‹ Prev
          </Pager>

          <div className="rounded-lg border border-slate-800/70 bg-slate-900/90 px-4 py-2 text-sm text-slate-400 shadow-sm">
            Page <strong className="text-slate-100 mx-1">{page}</strong> of {totalPages}
          </div>

          <Pager onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next ›
          </Pager>
          <Pager onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            Last »
          </Pager>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRow && <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
}

/* ---------------------- Small components (professional dark theme) ---------------------- */

function Th({ children, sortable, active, order, center, ...rest }) {
  return (
    <th
      className={
        "px-6 py-4 text-left text-xs font-semibold tracking-wide uppercase text-slate-400 " +
        (center ? "text-center " : "") +
        (sortable ? "cursor-pointer select-none hover:text-slate-300 transition-colors" : "")
      }
      {...rest}
    >
      <div className="inline-flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-100">{children}</span>
        {sortable && (
          <span className="text-xs font-medium transition-colors">
            {active ? (order === "asc" ? "▲" : "▼") : "↕️"}
          </span>
        )}
      </div>
    </th>
  );
}

function Td({ children, center, className = "" }) {
  return (
    <td className={"px-6 py-4 text-sm font-medium text-slate-200 " + (center ? "text-center " : "") + className}>
      {children}
    </td>
  );
}

function Pager({ children, disabled, ...rest }) {
  return (
    <button
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 border shadow-sm ${
        disabled
          ? "bg-slate-950/50 text-slate-600 border-slate-800/50 cursor-not-allowed"
          : "bg-slate-900/80 text-slate-200 border-slate-700/70 hover:bg-slate-800 hover:text-slate-100 hover:shadow-md hover:border-slate-600/70 active:scale-95"
      }`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

function StatusPill({ ok }) {
  return ok ? (
    <span className="inline-flex items-center rounded-full bg-emerald-900/70 px-3 py-1.5 text-xs font-semibold text-emerald-200 border border-emerald-700/60 shadow-sm">
      ✓ Yes
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-rose-900/70 px-3 py-1.5 text-xs font-semibold text-rose-200 border border-rose-700/60 shadow-sm">
      ✕ No
    </span>
  );
}

/* ---------------------- Detail Modal (professional dark theme) ---------------------- */

function DetailModal({ row, onClose }) {
  const [activeSection, setActiveSection] = useState("StudentRecord");

  const sections = [
    { key: "StudentRecord", label: "Student Record" },
    { key: "AdmitCard", label: "Admit Card" },
    { key: "DemoClasses", label: "Demo Classes" },
    { key: "ReferredRecord", label: "Referred Record" },
    { key: "Result", label: "Result" },
    { key: "Queries", label: "Queries" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-6 backdrop-blur-sm">
      <div className="relative mx-auto w-full max-w-7xl rounded-3xl border border-slate-800/70 bg-slate-950/95 shadow-2xl backdrop-blur-xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/70 px-8 py-6 bg-slate-950/95 backdrop-blur-sm">
          <div>
            <h3 className="text-2xl font-bold text-slate-50 tracking-tight">{row.fullName}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {row.student_ID} • {row.college} • {row.branch} • {row.year} year
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700/70 bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/90 hover:border-slate-600/70 hover:shadow-lg transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-24 z-10 flex gap-px border-b border-slate-800/50 bg-slate-900/80 px-8 py-4 backdrop-blur-sm">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 shadow-sm ${
                activeSection === s.key
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/25 border border-indigo-500/50 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-md hover:border-slate-700/50 border border-transparent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-8 py-8">
          {/* Student Record */}
          {activeSection === "StudentRecord" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Info label="Student ID" value={row.student_ID} />
              <Info label="Full Name" value={row.fullName} />
              <Info label="Phone" value={row.phoneNo} />
              <Info label="Email" value={row.mail_ID} />
              <Info label="College" value={row.college} />
              <Info label="Branch" value={row.branch} />
              <Info label="Year" value={row.year} />
              <Info label="DOB" value={row.dob} />
              <Info label="Submitted At" value={formatDate(row.createdAt)} />
            </div>
          )}

          {/* Admit Card */}
          {activeSection === "AdmitCard" && (
            <div>
              <h4 className="mb-6 text-lg font-semibold text-slate-100">Admit Card Details</h4>
              {row.admitCards?.length > 0 ? (
                row.admitCards.map((ac) => (
                  <div key={ac.id} className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-xl font-bold text-slate-100">{ac.ApplicantName}</div>
                        <div className="text-sm font-mono text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded-full inline-block mt-1">
                          {ac.RSAT}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">{ac.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <Info label="Venue" value={ac.venue} />
                      <Info label="Exam Date" value={ac.examDate ? new Date(ac.examDate).toLocaleDateString() : "-"} />
                      <Info label="Exam Time" value={ac.examTime} />
                      <Info label="Reporting Time" value={ac.ReportingTime} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800/50 text-xs text-slate-500">
                      Issued: {formatDate(ac.issuedDate)} • Email: {ac.emailSent ? "Sent" : "Pending"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">📄</div>
                  No admit cards available.
                </div>
              )}
            </div>
          )}

          {/* Demo Classes */}
          {activeSection === "DemoClasses" && (
            <div>
              <h4 className="mb-6 text-lg font-semibold text-slate-100">Demo Class Bookings</h4>
              {row.demos?.length > 0 ? (
                row.demos.map((d) => (
                  <div key={d.id} className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="font-bold text-xl text-slate-100">{d.demoSlot}</div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          d.type === "online"
                            ? "bg-blue-900/50 text-blue-300 border border-blue-700/50"
                            : "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
                        }`}
                      >
                        {d.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <Info label="College" value={d.collegeName} />
                      <Info label="Year" value={d.year} />
                      <Info label="Phone" value={d.phone} />
                      <Info label="Email" value={d.email} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🎓</div>
                  No demo bookings found.
                </div>
              )}
            </div>
          )}

          {/* Referred Records */}
          {activeSection === "ReferredRecord" && (
            <div>
              <h4 className="mb-6 text-lg font-semibold text-slate-100">Referred Students</h4>
              {row.referrals?.length > 0 ? (
                row.referrals.map((ref) => (
                  <div key={ref.id} className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold text-slate-100">{ref.referredName}</div>
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-900/40 px-2.5 py-1 rounded-full">
                        {ref.refCode}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <Info label="Phone" value={ref.referredPhone} />
                      <Info label="Email" value={ref.referredEmail} />
                      <Info label="College" value={ref.collegeName} />
                      <Info label="Year" value={ref.year} />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Referred: {formatDate(ref.referredDate)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">👥</div>
                  No referred students.
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {activeSection === "Result" && (
            <div>
              <h4 className="mb-6 text-lg font-semibold text-slate-100">Exam Results</h4>
              {row.results?.length > 0 ? (
                row.results.map((res) => (
                  <div key={res.id} className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 text-center">
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Subject A</div>
                        <div className="text-2xl font-bold text-slate-100">{res.A}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Subject B</div>
                        <div className="text-2xl font-bold text-slate-100">{res.B}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Subject C</div>
                        <div className="text-2xl font-bold text-slate-100">{res.C}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Subject D</div>
                        <div className="text-2xl font-bold text-slate-100">{res.D}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/60 to-emerald-800/60 border border-emerald-700/50 col-span-2 md:col-span-1">
                        <div className="text-sm text-emerald-300 uppercase tracking-wide font-semibold">Total</div>
                        <div className="text-3xl font-black text-emerald-200">{res.total}</div>
                        <div className="text-sm text-emerald-300">({res.percentage}%)</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-800/50">
                      Recorded: {formatDate(res.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">📊</div>
                  No result data available.
                </div>
              )}
            </div>
          )}

          {/* Queries */}
          {activeSection === "Queries" && (
            <div>
              <h4 className="mb-6 text-lg font-semibold text-slate-100">Support Queries</h4>
              {row.supportQueries?.length > 0 ? (
                row.supportQueries.map((q) => (
                  <div key={q.id} className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/80 p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-800/50">
                      <div>
                        <div className="text-xl font-bold text-slate-100 mb-1">{q.subject}</div>
                        <div className="text-slate-400 leading-relaxed">{q.description}</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(q.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-900/60 to-purple-900/60 text-indigo-300 border border-indigo-700/50">
                        {q.status.toUpperCase()}
                      </span>
                    </div>

                    {q.responses?.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-2">Responses</div>
                        {q.responses.map((r) => (
                          <div key={r.id} className="rounded-xl bg-slate-800/60 p-4 border-l-4 border-indigo-500/50">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <span className="font-semibold text-slate-400">{r.senderType}</span>
                              <span>• {formatDate(r.createdAt)}</span>
                            </div>
                            <div className="text-sm text-slate-200">{r.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">💬</div>
                  No queries raised by this student.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="group rounded-xl border border-slate-800/70 bg-slate-900/90 p-5 hover:border-slate-700/70 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-200 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-400 mb-2">
        {label}
      </div>
      <div className="text-lg font-bold text-slate-100 break-words">{value ?? "-"}</div>
    </div>
  );
}
