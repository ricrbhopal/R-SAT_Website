import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  FiUsers, 
  FiCheckCircle, 
  FiActivity, 
  FiCalendar, 
  FiTrendingUp, 
  FiArrowUpRight,
  FiRefreshCw,
  FiBarChart2,
  FiDownload,
  FiFilter,
  FiSearch,
  FiChevronRight,

  FiTarget,
  FiPercent,
  FiClock,
  FiUserPlus,
  FiDollarSign
} from "react-icons/fi";
import { ManagerAPI } from "../../../config/api";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

// Theme configuration
const theme = {
  colors: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
    },
    secondary: {
      500: "#8b5cf6",
      600: "#7c3aed",
    },
    success: {
      500: "#10b981",
      600: "#059669",
    },
    warning: {
      500: "#f59e0b",
      600: "#d97706",
    },
    background: {
      dark: "#0f172a",
      card: "#1e293b",
      light: "#334155",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
      muted: "#64748b",
    }
  }
};

const timeRanges = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last quarter", value: "quarter" }
];

export default function DashboardOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withAdmit: 0,
    withResults: 0,
    withDemo: 0,
    referrals: 0,
    activeUsers: 0,
    dailyGrowth: 0,
    counts: [],
    distribution: [],
    recent: [],
    trendData: [],
    conversionRate: 0,
    demoRate: 0,
    completionRate: 0,
    avgReferrals: 0
  });

  // Fetch data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter data when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data.slice(0, 100)); // Show first 100 records by default
    } else {
      const filtered = data.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mail_ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNo?.includes(searchTerm) ||
        user.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student_ID?.toString().includes(searchTerm)
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ManagerAPI.getAllUsers();
      const userData = response?.data || [];
      setData(userData);
      setFilteredData(userData.slice(0, 100)); // Show first 100 initially
      calculateStats(userData);
      toast.success("Dashboard data refreshed successfully");
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate all statistics
  const calculateStats = (userData) => {
    const total = userData.length;
    const withAdmit = userData.filter(u => u.admitCards?.length > 0).length;
    const withResults = userData.filter(u => u.results?.length > 0).length;
    const withDemo = userData.filter(u => u.demos?.length > 0).length;
    const referrals = userData.reduce((sum, u) => sum + (u.referrals?.length || 0), 0);
    
    // Calculate active users (last 7 days) - using createdAt as fallback since lastActive doesn't exist
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = userData.filter(u => {
      const activityDate = u.lastActive || u.createdAt;
      return activityDate && new Date(activityDate) > weekAgo;
    }).length;

    // Calculate daily growth
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const todayCount = userData.filter(u => 
      u.createdAt && u.createdAt.startsWith(today)
    ).length;
    
    const yesterdayCount = userData.filter(u => 
      u.createdAt && u.createdAt.startsWith(yesterdayStr)
    ).length;
    
    const dailyGrowth = yesterdayCount > 0 
      ? ((todayCount - yesterdayCount) / yesterdayCount * 100)
      : todayCount > 0 ? 100 : 0;

    // Generate last 7 days data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        date: dateStr,
        day: dayName,
        registrations: userData.filter(u => 
          u.createdAt && u.createdAt.startsWith(dateStr)
        ).length,
        admits: userData.filter(u => 
          u.admitCards?.some(card => card.issuedDate?.startsWith(dateStr))
        ).length,
        demos: userData.filter(u => 
          u.demos?.some(demo => demo.date?.startsWith(dateStr))
        ).length,
        results: userData.filter(u => 
          u.results?.some(result => result.createdAt?.startsWith(dateStr))
        ).length
      };
    });

    // Distribution data for pie chart - showing actual student counts at each stage
    const registeredOnly = total - withAdmit - withDemo - withResults;
    const distribution = [
      { 
        name: "Registered Only", 
        value: Math.max(0, registeredOnly), 
        color: theme.colors.primary[500],
        description: "Students only registered, no other activity"
      },
      { 
        name: "Admit Issued", 
        value: withAdmit, 
        color: theme.colors.secondary[500],
        description: "Students with admit cards"
      },
      { 
        name: "Demo Booked", 
        value: withDemo, 
        color: theme.colors.warning[500],
        description: "Students with demo sessions"
      },
      { 
        name: "Results Published", 
        value: withResults, 
        color: theme.colors.success[500],
        description: "Students with results"
      },
    ].filter(item => item.value > 0);

    // Recent users (latest 6)
    const recent = [...userData]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);

    // Trend data for area chart
    const trendData = last7Days.map(day => ({
      name: day.day,
      "New Registrations": day.registrations,
      "Admit Cards": day.admits,
      "Demo Sessions": day.demos,
      "Results Published": day.results
    }));

    // Calculate rates
    const conversionRate = ((withAdmit / (total || 1)) * 100);
    const demoRate = ((withDemo / (total || 1)) * 100);
    const completionRate = ((withResults / (withAdmit || 1)) * 100);
    const avgReferrals = (referrals / (total || 1));

    setStats({
      total,
      withAdmit,
      withResults,
      withDemo,
      referrals,
      activeUsers,
      dailyGrowth: Number(dailyGrowth.toFixed(1)),
      counts: last7Days,
      distribution,
      recent,
      trendData,
      conversionRate: Number(conversionRate.toFixed(1)),
      demoRate: Number(demoRate.toFixed(1)),
      completionRate: Number(completionRate.toFixed(1)),
      avgReferrals: Number(avgReferrals.toFixed(1))
    });
  };

  // Handle Excel Export with clean formatting
  const handleExcelExport = async () => {
    setExportLoading(true);
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // ======================= SUMMARY SHEET =======================
      const summaryData = [
        ["MANAGER DASHBOARD - SUMMARY REPORT"],
        ["Generated on:", new Date().toLocaleString()],
        ["Time Range:", timeRanges.find(t => t.value === timeRange)?.label || "Last 7 days"],
        ["Total Records:", stats.total],
        [""],
        ["KEY PERFORMANCE INDICATORS"],
        ["Metric", "Value", "Details"],
        ["Total Students", stats.total, "All registered students"],
        ["Active Students (Last 7 Days)", stats.activeUsers, "Students active in last 7 days"],
        ["Admit Cards Issued", stats.withAdmit, "Students with admit cards"],
        ["Demo Classes Booked", stats.withDemo, "Students who booked demo"],
        ["Results Published", stats.withResults, "Students with published results"],
        ["Total Referrals", stats.referrals, "Total referral count"],
        ["Daily Growth Rate", `${stats.dailyGrowth}%`, "Compared to yesterday"],
        ["Admit Conversion Rate", `${stats.conversionRate}%`, "Percentage of admits from total"],
        ["Demo Booking Rate", `${stats.demoRate}%`, "Percentage of demos from total"],
        ["Completion Rate", `${stats.completionRate}%`, "Results published vs admits"],
        ["Avg. Referrals per Student", stats.avgReferrals, "Average referral count per student"],
        [""],
        ["LAST 7 DAYS ACTIVITY"],
        ["Date", "Day", "New Registrations", "Admit Cards", "Demo Sessions", "Results Published"]
      ];

      // Add 7-day activity data
      stats.counts.forEach(day => {
        summaryData.push([day.date, day.day, day.registrations, day.admits, day.demos, day.results]);
      });

      summaryData.push([""]);
      summaryData.push(["FUNNEL DISTRIBUTION"]);
      summaryData.push(["Stage", "Count", "Percentage", "Description"]);

      stats.distribution.forEach(item => {
        const percentage = ((item.value / (stats.total || 1)) * 100).toFixed(1);
        summaryData.push([item.name, item.value, `${percentage}%`, item.description]);
      });

      // Create summary worksheet
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Style summary sheet
      summaryWs["!cols"] = [
        { wch: 25 }, // Column A width
        { wch: 20 }, // Column B width
        { wch: 20 }, // Column C width
        { wch: 30 }  // Column D width
      ];

      // Add summary sheet to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // ======================= STUDENT DATA SHEET =======================
      if (data.length > 0) {
        const studentHeaders = [
          "Student ID",
          "Full Name",
          "Email",
          "Phone",
          "College",
          "Branch",
          "Year",
          "Registration Date",
          "Status",
          "Admit Cards",
          "Demo Classes",
          "Results",
          "Referrals",
          "Last Active",
          "Support Queries"
        ];

        const studentRows = data.map(student => {
          const status = student.admitCards?.length > 0 ? 'Admit Issued' :
                        student.demos?.length > 0 ? 'Demo Booked' :
                        student.results?.length > 0 ? 'Results Ready' : 'Registered';
          
          return [
            student.student_ID || 'N/A',
            student.fullName || 'N/A',
            student.mail_ID || 'N/A',
            student.phoneNo || 'N/A',
            student.college || 'N/A',
            student.branch || 'N/A',
            student.year || 'N/A',
            student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A',
            status,
            student.admitCards?.length || 0,
            student.demos?.length || 0,
            student.results?.length || 0,
            student.referrals?.length || 0,
            student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never',
            student.supportQueries?.length || 0
          ];
        });

        const studentData = [studentHeaders, ...studentRows];
        const studentWs = XLSX.utils.aoa_to_sheet(studentData);
        
        // Auto-size columns for student data
        studentWs["!cols"] = studentHeaders.map(() => ({ wch: 15 }));
        
        XLSX.utils.book_append_sheet(wb, studentWs, "Student Data");

        // ======================= DETAILED SHEETS =======================
        
        // Admit Card Details
        const admitStudents = data.filter(s => s.admitCards?.length > 0);
        if (admitStudents.length > 0) {
          const admitHeaders = [
            "Student Name",
            "Student ID",
            "Email",
            "RSAT Code",
            "Exam Venue",
            "Exam Date",
            "Exam Time",
            "Reporting Time",
            "Status",
            "Email Sent",
            "Issued Date",
            "Instructions"
          ];

          const admitRows = [];
          admitStudents.forEach(student => {
            student.admitCards.forEach(admit => {
              admitRows.push([
                student.fullName || 'N/A',
                student.student_ID || 'N/A',
                student.mail_ID || 'N/A',
                admit.RSAT || 'N/A',
                admit.venue || 'N/A',
                admit.examDate ? new Date(admit.examDate).toLocaleDateString() : 'N/A',
                admit.examTime || 'N/A',
                admit.ReportingTime || 'N/A',
                admit.status || 'Pending',
                admit.emailSent ? 'Yes' : 'No',
                admit.issuedDate ? new Date(admit.issuedDate).toLocaleDateString() : 'N/A',
                admit.instructions || 'N/A'
              ]);
            });
          });

          const admitData = [admitHeaders, ...admitRows];
          const admitWs = XLSX.utils.aoa_to_sheet(admitData);
          XLSX.utils.book_append_sheet(wb, admitWs, "Admit Cards");
        }

        // Demo Class Details
        const demoStudents = data.filter(s => s.demos?.length > 0);
        if (demoStudents.length > 0) {
          const demoHeaders = [
            "Student Name",
            "Email",
            "Phone",
            "College",
            "Year",
            "Demo Date",
            "Demo Time",
            "Session Type",
            "Status",
            "Booked On",
            "Duration",
            "Topics"
          ];

          const demoRows = [];
          demoStudents.forEach(student => {
            student.demos.forEach(demo => {
              demoRows.push([
                student.fullName || demo.studentName || 'N/A',
                student.mail_ID || demo.email || 'N/A',
                student.phoneNo || demo.phone || 'N/A',
                student.college || demo.collegeName || 'N/A',
                student.year || demo.year || 'N/A',
                demo.date ? new Date(demo.date).toLocaleDateString() : 'N/A',
                demo.time || 'N/A',
                demo.type || 'Online',
                demo.status || 'Scheduled',
                demo.createdAt ? new Date(demo.createdAt).toLocaleDateString() : 'N/A',
                demo.duration || '1 Hour',
                demo.topics || 'General Discussion'
              ]);
            });
          });

          const demoData = [demoHeaders, ...demoRows];
          const demoWs = XLSX.utils.aoa_to_sheet(demoData);
          XLSX.utils.book_append_sheet(wb, demoWs, "Demo Classes");
        }

        // Results Details
        const resultStudents = data.filter(s => s.results?.length > 0);
        if (resultStudents.length > 0) {
          const resultHeaders = [
            "Student Name",
            "Student ID",
            "Email",
            "Subject A",
            "Subject B",
            "Subject C",
            "Subject D",
            "Total Marks",
            "Percentage",
            "Grade",
            "Scholarship (%)",
            "Rank",
            "Published Date"
          ];

          const resultRows = [];
          resultStudents.forEach(student => {
            student.results.forEach(result => {
              resultRows.push([
                student.fullName || 'N/A',
                student.student_ID || result.student_ID_custom || 'N/A',
                student.mail_ID || 'N/A',
                result.A || 0,
                result.B || 0,
                result.C || 0,
                result.D || 0,
                result.total || 0,
                result.percentage ? `${result.percentage}%` : '0%',
                result.grade || 'N/A',
                result.scholarShip || 0,
                result.rank || 'N/A',
                result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A'
              ]);
            });
          });

          const resultData = [resultHeaders, ...resultRows];
          const resultWs = XLSX.utils.aoa_to_sheet(resultData);
          XLSX.utils.book_append_sheet(wb, resultWs, "Results");
        }

        // Referrals Details
        const referralStudents = data.filter(s => s.referrals?.length > 0);
        if (referralStudents.length > 0) {
          const referralHeaders = [
            "Referrer Name",
            "Referrer ID",
            "Referrer Email",
            "Referred Name",
            "Referred Email",
            "Referred Phone",
            "College",
            "Year",
            "Referral Code",
            "Status",
            "Referred Date",
            "Bonus Awarded"
          ];

          const referralRows = [];
          referralStudents.forEach(student => {
            student.referrals.forEach(ref => {
              referralRows.push([
                student.fullName || 'N/A',
                student.student_ID || 'N/A',
                student.mail_ID || 'N/A',
                ref.referredName || 'N/A',
                ref.referredEmail || 'N/A',
                ref.referredPhone || 'N/A',
                ref.collegeName || 'N/A',
                ref.year || 'N/A',
                ref.refCode || 'N/A',
                ref.status || 'Pending',
                ref.referredDate ? new Date(ref.referredDate).toLocaleDateString() : 'N/A',
                ref.bonusAwarded ? 'Yes' : 'No'
              ]);
            });
          });

          const referralData = [referralHeaders, ...referralRows];
          const referralWs = XLSX.utils.aoa_to_sheet(referralData);
          XLSX.utils.book_append_sheet(wb, referralWs, "Referrals");
        }
      }

      // ======================= EXPORT FILE =======================
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const fileName = `Manager_Dashboard_${timestamp}.xlsx`;
      
      // Write and download file
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Report exported successfully: ${fileName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Quick CSV Export
  const handleQuickCSVExport = () => {
    try {
      const exportData = filteredData.map(student => ({
        "Student ID": student.student_ID || 'N/A',
        "Full Name": student.fullName || 'N/A',
        "Email": student.mail_ID || 'N/A',
        "Phone": student.phoneNo || 'N/A',
        "College": student.college || 'N/A',
        "Branch": student.branch || 'N/A',
        "Year": student.year || 'N/A',
        "Registration Date": student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A',
        "Status": student.admitCards?.length > 0 ? 'Admit Issued' :
                  student.demos?.length > 0 ? 'Demo Booked' :
                  student.results?.length > 0 ? 'Results Ready' : 'Registered',
        "Admit Cards": student.admitCards?.length || 0,
        "Demo Classes": student.demos?.length || 0,
        "Results": student.results?.length || 0,
        "Referrals": student.referrals?.length || 0,
        "Last Active": student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      
      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Students_List_${timestamp}.xlsx`);
      
      toast.success("Student data exported successfully!");
    } catch (error) {
      console.error("Quick export error:", error);
      toast.error("Failed to export data");
    }
  };

  // View student details
  const viewStudentDetails = (student) => {
    toast.info(`Viewing details for ${student.fullName || 'student'}`, {
      autoClose: 2000,
    });
    // In a real app, you would navigate to student details page
    // navigate(`/student/${student.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Manager Dashboard
            </h1>
            <p className="text-gray-400">
              Comprehensive overview of student activities and performance
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
      
            
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            
            <div className="relative group">
              <button
                onClick={handleExcelExport}
                disabled={exportLoading || loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className={exportLoading ? "animate-spin" : ""} />
                {exportLoading ? "Exporting..." : "Full Export"}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl p-2 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 z-50">
                <button
                  onClick={handleQuickCSVExport}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  Quick Export (Current View)
                </button>
                <div className="text-xs text-gray-400 px-3 py-1">
                  Exports {filteredData.length} records
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Students"
            value={stats.total}
            change={`+${stats.dailyGrowth}% today`}
            icon={<FiUsers className="w-6 h-6" />}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            change="Last 7 days"
            icon={<FiActivity className="w-6 h-6" />}
            color="green"
            loading={loading}
          />
          <StatCard
            title="Admit Cards"
            value={stats.withAdmit}
            change={`${stats.conversionRate}% conversion`}
            icon={<FiCheckCircle className="w-6 h-6" />}
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Total Referrals"
            value={stats.referrals}
            change={`${stats.avgReferrals} avg/student`}
            icon={<FiUserPlus className="w-6 h-6" />}
            color="orange"
            loading={loading}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <ChartCard
            title="Activity Overview"
            subtitle="Last 7 days performance trends"
            icon={<FiBarChart2 className="w-5 h-5 text-blue-400" />}
            loading={loading}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.colors.primary[500]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.colors.primary[500]} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAdmits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.colors.secondary[500]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.colors.secondary[500]} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDemos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.colors.warning[500]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.colors.warning[500]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="New Registrations" 
                    stroke={theme.colors.primary[500]}
                    fill="url(#colorRegistrations)"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Admit Cards" 
                    stroke={theme.colors.secondary[500]}
                    fill="url(#colorAdmits)"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Demo Sessions" 
                    stroke={theme.colors.warning[500]}
                    fill="url(#colorDemos)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Distribution Chart */}
          <ChartCard
            title="Funnel Distribution"
            subtitle="Student progression through stages"
            icon={<FiTarget className="w-5 h-5 text-purple-400" />}
            loading={loading}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="value"
                  >
                    {stats.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} students`,
                      props.payload.description
                    ]}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb',
                  
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Students */}
          <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Recent Students {filteredData.length > 0 && `(${filteredData.length} found)`}
                </h3>
                <p className="text-gray-400 text-sm">
                  {searchTerm ? `Search results for "${searchTerm}"` : "Latest registrations"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickCSVExport}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-3 py-1 bg-emerald-500/10 rounded-lg"
                >
                  <FiDownload className="w-3 h-3" />
                  Export
                </button>
                <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View all <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 hidden md:table-cell">College</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-700/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700/50 rounded-lg animate-pulse" />
                            <div>
                              <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse mb-2" />
                              <div className="h-3 w-24 bg-gray-700/50 rounded animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-6 w-20 bg-gray-700/50 rounded-full animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.slice(0, 10).map((student, index) => (
                      <StudentRow key={student.id || index} student={student} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-12 text-center">
                        <FiUsers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No students found</p>
                        {searchTerm && (
                          <p className="text-sm text-gray-500 mt-1">
                            Try a different search term
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {!loading && filteredData.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  Showing 10 of {filteredData.length} students. 
                  <button 
                    onClick={handleQuickCSVExport}
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    Export all for complete view
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats & Export Info */}
          <div className="space-y-6">
  
            {/* Export Information */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FiDownload className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Export Options</h3>
                  <p className="text-gray-400 text-sm">Get detailed reports</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm font-medium text-white mb-1">Full Excel Report</p>
                  <p className="text-xs text-gray-400">
                    Complete dashboard data with multiple sheets (Summary, Student Data, Details)
                  </p>
                  <button
                    onClick={handleExcelExport}
                    disabled={exportLoading || loading}
                    className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportLoading ? "Preparing Report..." : "Download Full Report"}
                  </button>
                </div>
                
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-sm font-medium text-white mb-1">Quick Export</p>
                  <p className="text-xs text-gray-400">
                    Current view ({filteredData.length} students) in Excel format
                  </p>
                  <button
                    onClick={handleQuickCSVExport}
                    className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Download Current List
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
                <div className="flex justify-between mb-1">
                  <span>Last updated:</span>
                  <span className="text-white">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total records:</span>
                  <span className="text-white">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, change, icon, color, loading }) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-gray-600/50 transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-400">{change}</span>
      </div>
      
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">
          {loading ? (
            <div className="h-8 w-20 bg-gray-700/50 rounded animate-pulse" />
          ) : (
            value.toLocaleString()
          )}
        </p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children, loading }) {
  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-40 bg-gray-700/50 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-gray-700/50 rounded-lg animate-pulse" />
        </div>
        <div className="h-72 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
        {icon}
      </div>
      {children}
    </div>
  );
}

function StudentRow({ student }) {
  const getStatus = () => {
    if (student.admitCards?.length > 0) return { 
      text: "Admit Issued", 
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: "✓"
    };
    if (student.demos?.length > 0) return { 
      text: "Demo Booked", 
      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      icon: "📅"
    };
    if (student.results?.length > 0) return { 
      text: "Results Ready", 
      color: "bg-green-500/20 text-green-300 border-green-500/30",
      icon: "📊"
    };
    return { 
      text: "Registered", 
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      icon: "👤"
    };
  };

  const status = getStatus();

  return (
    <tr className="border-b border-gray-700/30 hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <span className="text-sm font-semibold text-blue-300">
              {student.fullName?.[0]?.toUpperCase() || "S"}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-white text-sm">
              {student.fullName || "Student Name"}
            </h4>
            <p className="text-xs text-gray-400">
              {student.mail_ID || student.email || "No email"}
              {student.phoneNo && ` • ${student.phoneNo}`}
            </p>
          </div>
        </div>
      </td>
      
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="text-sm text-gray-300">
          {student.college || "Independent"}
          {student.year && <span className="text-xs text-gray-500 ml-1">(Yr {student.year})</span>}
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.icon} {status.text}
          </span>
        </div>
      </td>
      
    </tr>
  );
}

function MetricItem({ label, value, description, color, loading }) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className={`px-3 py-1 rounded-lg ${colorClasses[color]} font-bold`}>
        {loading ? (
          <div className="h-6 w-12 bg-gray-700/50 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};