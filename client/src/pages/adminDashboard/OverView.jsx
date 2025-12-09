import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FiUsers, FiAward, FiTrendingUp, FiMessageSquare, FiDownload, FiEye, FiBarChart2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { AdminAPI } from "../../config/api";

// Enhanced color palette
const COLORS = {
  blue: {
    primary: "#3B82F6",
    light: "#60A5FA",
    dark: "#1D4ED8",
    gradient: "from-blue-500 to-blue-600"
  },
  emerald: {
    primary: "#10B981",
    light: "#34D399",
    dark: "#059669",
    gradient: "from-emerald-500 to-emerald-600"
  },
  amber: {
    primary: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
    gradient: "from-amber-500 to-amber-600"
  },
  rose: {
    primary: "#EF4444",
    light: "#F87171",
    dark: "#DC2626",
    gradient: "from-rose-500 to-rose-600"
  },
  violet: {
    primary: "#8B5CF6",
    light: "#A78BFA",
    dark: "#7C3AED",
    gradient: "from-violet-500 to-violet-600"
  },
  indigo: {
    primary: "#6366F1",
    light: "#818CF8",
    dark: "#4F46E5",
    gradient: "from-indigo-500 to-indigo-600"
  },
  teal: {
    primary: "#14B8A6",
    light: "#2DD4BF",
    dark: "#0D9488",
    gradient: "from-teal-500 to-teal-600"
  }
};

const CHART_COLORS = [
  "url(#blueGradient)",
  "url(#greenGradient)",
  "url(#purpleGradient)",
  "url(#orangeGradient)",
  "url(#redGradient)"
];

export default function OverView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userStats, setUserStats] = useState({ total: 0, referred: 0 });
  const [admitStats, setAdmitStats] = useState({ total: 0 });
  const [resultStats, setResultStats] = useState({ total: 0, qualified: 0, failed: 0 });
  const [supportStats, setSupportStats] = useState({ total: 0 });
  const [lastWeekStats, setLastWeekStats] = useState({
    users: 0,
    referred: 0,
    admit: 0,
    results: 0,
    support: 0,
    qualified: 0,
    failed: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, referredRes, admitRes, resultsRes, supportRes] = await Promise.all([
          AdminAPI.getAllStudents().catch(() => ({ data: [] })),
          AdminAPI.getRefferedUsers().catch(() => ({ data: [] })),
          AdminAPI.getAllAdmitCards().catch(() => ({ data: [] })),
          AdminAPI.getAllResults().catch(() => ({ data: [] })),
          AdminAPI.GetAllSupportQueries().catch(() => ({ data: [] })),
        ]);

        const studentsData = studentsRes?.data || [];
        const referredData = referredRes?.data || [];
        const admitData = admitRes?.data || [];
        const resultsData = resultsRes?.data || [];
        const supportData = supportRes?.data || [];

        setUserStats({
          total: studentsData.length || 0,
          referred: referredData.length || 0,
        });

        setAdmitStats({
          total: admitData.length || 0,
        });

        const results = Array.isArray(resultsData) ? resultsData : [];
        setResultStats({
          total: results.length,
          qualified: results.filter(r => r?.percentage >= 60).length,
          failed: results.filter(r => r?.percentage < 60).length,
        });

        setSupportStats({
          total: supportData.length || 0,
        });

        // Mock last week stats (replace with actual API calls)
        setLastWeekStats({
          users: Math.max(0, studentsData.length - Math.floor(Math.random() * 20)),
          referred: Math.max(0, referredData.length - Math.floor(Math.random() * 10)),
          admit: Math.max(0, admitData.length - Math.floor(Math.random() * 15)),
          results: Math.max(0, results.length - Math.floor(Math.random() * 8)),
          support: Math.max(0, supportData.length - Math.floor(Math.random() * 5)),
          qualified: Math.max(0, results.filter(r => r?.percentage >= 60).length - Math.floor(Math.random() * 5)),
          failed: Math.max(0, results.filter(r => r?.percentage < 60).length - Math.floor(Math.random() * 3)),
        });
      } catch (err) {
      
        setError("Failed to load dashboard stats. Please try again.");
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  // Helper to calculate percentage change with trend indicator
  function getTrend(current, lastWeek) {
    if (lastWeek === 0) return { value: current === 0 ? "0%" : "+100%", isPositive: current > 0, isNeutral: current === 0 };
    const change = ((current - lastWeek) / lastWeek) * 100;
    const sign = change > 0 ? "+" : "";
    return { 
      value: `${sign}${change.toFixed(1)}%`, 
      isPositive: change > 0, 
      isNeutral: change === 0 
    };
  }

  // Stats cards data with enhanced styling
  const statsCards = [
    {
      title: "Total Students",
      value: userStats.total || 0,
      icon: <FiUsers className="text-xl sm:text-2xl" />,
      color: COLORS.blue,
      trend: getTrend(userStats.total, lastWeekStats.users),
      description: "Active registered students",
      gradient: "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
      border: "border-blue-200"
    },
    {
      title: "Referred Users",
      value: userStats.referred || 0,
      icon: <FiTrendingUp className="text-xl sm:text-2xl" />,
      color: COLORS.emerald,
      trend: getTrend(userStats.referred, lastWeekStats.referred),
      description: "Users from referral program",
      gradient: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10",
      border: "border-emerald-200"
    },
    {
      title: "Admit Cards",
      value: admitStats.total || 0,
      icon: <FiAward className="text-xl sm:text-2xl" />,
      color: COLORS.violet,
      trend: getTrend(admitStats.total, lastWeekStats.admit),
      description: "Generated admit cards",
      gradient: "bg-gradient-to-br from-violet-500/10 to-violet-600/10",
      border: "border-violet-200"
    },
    {
      title: "Support Queries",
      value: supportStats.total || 0,
      icon: <FiMessageSquare className="text-xl sm:text-2xl" />,
      color: COLORS.amber,
      trend: getTrend(supportStats.total, lastWeekStats.support),
      description: "Pending support tickets",
      gradient: "bg-gradient-to-br from-amber-500/10 to-amber-600/10",
      border: "border-amber-200"
    }
  ];

  // Data for charts
  const barData = [
    { name: "Students", value: userStats.total || 0, color: COLORS.blue.primary },
    { name: "Referred", value: userStats.referred || 0, color: COLORS.emerald.primary },
    { name: "Admit Cards", value: admitStats.total || 0, color: COLORS.violet.primary },
    { name: "Results", value: resultStats.total || 0, color: COLORS.indigo.primary },
    { name: "Support", value: supportStats.total || 0, color: COLORS.amber.primary },
  ];
  
  const pieData = [
    { name: "Qualified", value: resultStats.qualified || 0, color: COLORS.emerald.primary },
    { name: "Failed", value: resultStats.failed || 0, color: COLORS.rose.primary },
  ];


  // Calculate success rate safely
  const successRate = resultStats.total > 0 
    ? ((resultStats.qualified / resultStats.total) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10 p-4 sm:p-6">
      {/* Enhanced Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base font-medium">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16 sm:py-20">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-lg">
          <div className="text-red-600 text-base sm:text-lg font-bold">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 sm:mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {statsCards.map((stat, index) => (
              <div 
                key={index} 
                className={`bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border ${stat.border} p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 ${stat.gradient}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 text-xs sm:text-sm font-semibold truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {(stat.value || 0).toLocaleString()}
                    </p>
                    <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium mt-1 ${
                      stat.trend.isPositive ? "text-emerald-600" : stat.trend.isNeutral ? "text-gray-500" : "text-rose-600"
                    }`}>
                      {stat.trend.isPositive ? <FiArrowUp className="text-xs" /> : 
                       stat.trend.isNeutral ? <span className="w-2"></span> : <FiArrowDown className="text-xs" />}
                      <span className="truncate">{stat.trend.value} from last week</span>
                    </div>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color.gradient} text-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0 ml-3`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3 sm:mt-4 font-medium truncate">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Enhanced Bar Chart */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg sm:rounded-xl shadow-lg">
                    <FiTrendingUp className="text-white text-lg sm:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Platform Overview</h2>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">Key metrics and performance indicators</p>
                  </div>
                </div>
                <select className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 font-medium shadow-sm w-full sm:w-auto">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={250} className="text-xs sm:text-sm">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      background: 'white',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                    barSize={30}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced Pie Chart & Quick Actions */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Enhanced Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-2 rounded-lg sm:rounded-xl shadow-lg">
                    <FiAward className="text-white text-lg sm:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">Results Analysis</h2>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">Student performance breakdown</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180} className="text-xs">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg sm:rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold">
                    <span className="text-gray-600">Total Results:</span>
                    <span className="text-gray-900">{resultStats.total || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mt-1 sm:mt-2">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="text-emerald-600">
                      {successRate}%
                    </span>
                  </div>
                </div>
              </div>

    
            </div>
          </div>

        </>
      )}
    </div>
  );
}