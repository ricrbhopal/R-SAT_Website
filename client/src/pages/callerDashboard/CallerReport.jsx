// client/src/pages/CallerReport.jsx
import React, { useEffect, useState, useMemo } from "react";
import { CallerAPI } from "../../config/api";
import { Download, Search, Filter, X } from "lucide-react";
import * as XLSX from "xlsx";

/**
 * Helper: format DOB into DD-MM-YYYY
 */
function formatDOB(value) {
  if (value === null || value === undefined || value === "") return "-";

  if (value instanceof Date && !isNaN(value)) {
    const dd = String(value.getDate()).padStart(2, "0");
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const yyyy = value.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  if (typeof value === "string") {
    const s = value.trim();
    const iso = s.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [yy, mm, dd] = iso.split("-");
      return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yy}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.replace(/\//g, "-");
    
    const parsed = new Date(s);
    if (!isNaN(parsed)) {
      const dd = String(parsed.getDate()).padStart(2, "0");
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const yyyy = parsed.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    return "-";
  }

  const parsed = new Date(value);
  if (!isNaN(parsed)) {
    const dd = String(parsed.getDate()).padStart(2, "0");
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const yyyy = parsed.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return "-";
}

export default function CallerReport() {
  const [callers, setCallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("referred");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    year: "",
    admitCard: "all",
    demoSlot: "",
    resultCheck: "all"
  });

  // Table columns configuration based on filter
  const tableColumns = useMemo(() => {
    const baseColumns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'college', label: 'College' },
      { key: 'yearOrDob', label: 'Year / DOB' }
    ];

    const filterColumns = {
      referred: baseColumns,
      admitCard: [...baseColumns, { key: 'admitCardStatus', label: 'Admit Card Downloaded' }],
      demoClass: [...baseColumns, 
        { key: 'demoSlot', label: 'Demo Slot' },
        { key: 'demoType', label: 'Demo Type' }
      ],
      result: [...baseColumns, { key: 'resultCheckStatus', label: 'Result Check' }],
      student: [...baseColumns, { key: 'admitCardStatus', label: 'Admit Card' }]
    };

    return filterColumns[filter] || baseColumns;
  }, [filter]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    CallerAPI.listCallers()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data?.data ?? res?.data ?? [];
        setCallers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError("Failed to fetch callers");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return callers.filter((caller) => {
      // Main filter
      if (filter === "referred" && !caller.referred) return false;
      if (filter === "student" && !caller.student) return false;
      if (filter === "admitCard" && !caller.admitCard) return false;
      if (filter === "demoClass" && !caller.demoClass) return false;
      if (filter === "result" && !caller.result) return false;

      // Global search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const name = (caller.student?.fullName || caller.referred?.referredName || "").toLowerCase();
        const email = (caller.student?.mail_ID || caller.referred?.referredEmail || "").toLowerCase();
        const phone = (caller.student?.phoneNo || caller.referred?.referredPhone || "").toLowerCase();
        const college = (caller.student?.college || caller.referred?.collegeName || "").toLowerCase();
        
        if (!name.includes(searchLower) && 
            !email.includes(searchLower) && 
            !phone.includes(searchLower) && 
            !college.includes(searchLower)) {
          return false;
        }
      }

      // Advanced filters
      if (advancedFilters.name) {
        const name = (caller.student?.fullName || caller.referred?.referredName || "").toLowerCase();
        if (!name.includes(advancedFilters.name.toLowerCase())) return false;
      }

      if (advancedFilters.email) {
        const email = (caller.student?.mail_ID || caller.referred?.referredEmail || "").toLowerCase();
        if (!email.includes(advancedFilters.email.toLowerCase())) return false;
      }

      if (advancedFilters.phone) {
        const phone = (caller.student?.phoneNo || caller.referred?.referredPhone || "");
        if (!phone.includes(advancedFilters.phone)) return false;
      }

      if (advancedFilters.college) {
        const college = (caller.student?.college || caller.referred?.collegeName || "").toLowerCase();
        if (!college.includes(advancedFilters.college.toLowerCase())) return false;
      }

      if (advancedFilters.year) {
        const year = caller.student?.year || "";
        if (!year.toString().includes(advancedFilters.year)) return false;
      }

      if (advancedFilters.admitCard !== "all") {
        const hasAdmitCard = caller.admitCard?.present || false;
        if (advancedFilters.admitCard === "yes" && !hasAdmitCard) return false;
        if (advancedFilters.admitCard === "no" && hasAdmitCard) return false;
      }

      if (advancedFilters.demoSlot) {
        const demoSlot = caller.demoClass?.demoSlot || "";
        if (!demoSlot.toLowerCase().includes(advancedFilters.demoSlot.toLowerCase())) return false;
      }

      if (advancedFilters.resultCheck !== "all") {
        const hasResult = caller.result?.check || false;
        if (advancedFilters.resultCheck === "yes" && !hasResult) return false;
        if (advancedFilters.resultCheck === "no" && hasResult) return false;
      }

      return true;
    });
  }, [callers, filter, searchQuery, advancedFilters]);

  // Prepare data for display
  const tableData = useMemo(() => {
    return filteredData.map((caller) => {
      const name = caller.student?.fullName || caller.referred?.referredName || "-";
      const email = caller.student?.mail_ID || caller.referred?.referredEmail || "-";
      const phone = caller.student?.phoneNo || caller.referred?.referredPhone || "-";
      const college = caller.student?.college || caller.referred?.collegeName || "-";
      const dobSource = caller.student?.dob || caller.referred?.dob || caller.student?.year || "-";
      const yearOrDob = caller.student?.dob || caller.referred?.dob ? formatDOB(dobSource) : (caller.student?.year || "-");
      
      const admitCardStatus = caller.admitCard?.present ? "Yes" : "No";
      const demoSlot = caller.demoClass?.demoSlot || "-";
      const demoType = caller.demoClass?.type || "-";
      const resultCheckStatus = caller.result?.check ? "Yes" : "No";

      return {
        name,
        email,
        phone,
        college,
        yearOrDob,
        admitCardStatus,
        demoSlot,
        demoType,
        resultCheckStatus
      };
    });
  }, [filteredData]);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CallerReport");
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Caller_Report_${filter}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setAdvancedFilters({
      name: "",
      email: "",
      phone: "",
      college: "",
      year: "",
      admitCard: "all",
      demoSlot: "",
      resultCheck: "all"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Caller Report
          </h1>
          <p className="text-gray-400">Manage and analyze caller information</p>
        </div>

        {/* Filters Card */}
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-300 mb-2">
                Report Type
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full md:w-auto min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="referred">Student</option>
                <option value="admitCard">Admit Card</option>
                <option value="demoClass">Demo Class</option>
                <option value="result">Result</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
              </button>
              
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-500 hover:to-green-500 transition-all duration-300 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-800 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={advancedFilters.name}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="text"
                    value={advancedFilters.email}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={advancedFilters.phone}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by phone"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">College</label>
                  <input
                    type="text"
                    value={advancedFilters.college}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, college: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by college"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Year</label>
                  <input
                    type="text"
                    value={advancedFilters.year}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, year: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by year"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Admit Card</label>
                  <select
                    value={advancedFilters.admitCard}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, admitCard: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="yes">Downloaded</option>
                    <option value="no">Not Downloaded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Demo Slot</label>
                  <input
                    type="text"
                    value={advancedFilters.demoSlot}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, demoSlot: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                    placeholder="Filter by demo slot"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Result Check</label>
                  <select
                    value={advancedFilters.resultCheck}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, resultCheck: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="yes">Checked</option>
                    <option value="no">Not Checked</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Card */}
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          {/* Stats Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">
                  {filter === "referred" ? "Student" : filter.charAt(0).toUpperCase() + filter.slice(1)} Report
                </h3>
                <p className="text-sm text-gray-400">
                  Showing {filteredData.length} of {callers.length} records
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Active filters:</span>
                <span className="font-medium text-cyan-400">
                  {searchQuery && "Search • "}
                  {advancedFilters.name && "Name • "}
                  {advancedFilters.email && "Email • "}
                  {advancedFilters.phone && "Phone • "}
                  {advancedFilters.college && "College"}
                </span>
              </div>
            </div>
          </div>

          {/* Loading/Error/Empty States */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading caller data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-rose-500 text-lg mb-2">Error</div>
                <p className="text-gray-400">{error}</p>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-gray-600 text-4xl mb-4">📊</div>
                <h4 className="text-lg font-medium text-gray-300 mb-2">No data found</h4>
                <p className="text-gray-500">Try adjusting your filters or search criteria</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900/50">
                  <tr>
                    {tableColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tableData.map((row, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      {tableColumns.map((column) => (
                        <td
                          key={column.key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                        >
                          {row[column.key] === "Yes" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                              {row[column.key]}
                            </span>
                          ) : row[column.key] === "No" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400">
                              {row[column.key]}
                            </span>
                          ) : (
                            row[column.key] || "-"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 text-center text-sm text-gray-500">
          <p>Data updated in real-time • Export available in Excel format</p>
        </div>
      </div>
    </div>
  );
}