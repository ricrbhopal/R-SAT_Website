import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FiUsers, FiAward, FiTrendingUp, FiMessageSquare, FiDownload, FiEye, FiBarChart2 } from "react-icons/fi";
import { AdminAPI } from "../../config/api";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function OverView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userStats, setUserStats] = useState({ total: 0, referred: 0 });
  const [admitStats, setAdmitStats] = useState({ total: 0 });
  const [resultStats, setResultStats] = useState({ total: 0, qualified: 0, failed: 0 });
  const [supportStats, setSupportStats] = useState({ total: 0 });
  // Last week stats for trend calculation
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
        // Current stats
        const [studentsRes, referredRes, admitRes, resultsRes, supportRes] = await Promise.all([
          AdminAPI.getAllStudents().catch(() => ({ data: [] })),
          AdminAPI.getRefferedUsers().catch(() => ({ data: [] })),
          AdminAPI.getAllAdmitCards().catch(() => ({ data: [] })),
          AdminAPI.getAllResults().catch(() => ({ data: [] })),
          AdminAPI.GetAllSupportQueries().catch(() => ({ data: [] })),
        ]);

        // Last week stats (assuming backend supports ?from=YYYY-MM-DD&to=YYYY-MM-DD)
        const today = new Date();
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - 1);
        const formatDate = d => d.toISOString().split("T")[0];

        const [studentsLastWeek, referredLastWeek, admitLastWeek, resultsLastWeek, supportLastWeek] = await Promise.all([
          AdminAPI.getAllStudents({ params: { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) } }).catch(() => ({ data: [] })),
          AdminAPI.getRefferedUsers({ params: { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) } }).catch(() => ({ data: [] })),
          AdminAPI.getAllAdmitCards({ params: { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) } }).catch(() => ({ data: [] })),
          AdminAPI.getAllResults({ params: { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) } }).catch(() => ({ data: [] })),
          AdminAPI.GetAllSupportQueries({ params: { from: formatDate(lastWeekStart), to: formatDate(lastWeekEnd) } }).catch(() => ({ data: [] })),
        ]);

        // Safe data extraction with defaults
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

        // Last week stats
        setLastWeekStats({
          users: studentsLastWeek?.data?.length || 0,
          referred: referredLastWeek?.data?.length || 0,
          admit: admitLastWeek?.data?.length || 0,
          results: resultsLastWeek?.data?.length || 0,
          support: supportLastWeek?.data?.length || 0,
          qualified: (resultsLastWeek?.data?.filter(r => r?.percentage >= 60).length) || 0,
          failed: (resultsLastWeek?.data?.filter(r => r?.percentage < 60).length) || 0,
        });
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard stats. Please try again.");
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  // Data for charts with safe defaults
  const barData = [
    { name: "Students", value: userStats.total || 0 },
    { name: "Referred", value: userStats.referred || 0 },
    { name: "Admit Cards", value: admitStats.total || 0 },
    { name: "Results", value: resultStats.total || 0 },
    { name: "Support", value: supportStats.total || 0 },
  ];
  
  const pieData = [
    { name: "Qualified", value: resultStats.qualified || 0, color: COLORS[1] },
    { name: "Failed", value: resultStats.failed || 0, color: COLORS[3] },
  ];

  // Stats cards data with safe values
  // Helper to calculate percentage change
  function getTrend(current, lastWeek) {
    if (lastWeek === 0) return current === 0 ? "0%" : "+100%";
    const change = ((current - lastWeek) / lastWeek) * 100;
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  }

  const statsCards = [
    {
      title: "Total Students",
      value: userStats.total || 0,
      icon: <FiUsers className="text-2xl" />,
      color: "bg-blue-500",
      trend: getTrend(userStats.total, lastWeekStats.users),
      description: "Active registered students"
    },
    {
      title: "Referred Users",
      value: userStats.referred || 0,
      icon: <FiTrendingUp className="text-2xl" />,
      color: "bg-green-500",
      trend: getTrend(userStats.referred, lastWeekStats.referred),
      description: "Users from referral program"
    },
    {
      title: "Admit Cards",
      value: admitStats.total || 0,
      icon: <FiAward className="text-2xl" />,
      color: "bg-purple-500",
      trend: getTrend(admitStats.total, lastWeekStats.admit),
      description: "Generated admit cards"
    },
    {
      title: "Support Queries",
      value: supportStats.total || 0,
      icon: <FiMessageSquare className="text-2xl" />,
      color: "bg-orange-500",
      trend: getTrend(supportStats.total, lastWeekStats.support),
      description: "Pending support tickets"
    }
  ];

  // Quick actions
  const quickActions = [
    { title: "View Reports", icon: <FiBarChart2 />, color: "bg-blue-50 text-blue-600" },
    { title: "Export Data", icon: <FiDownload />, color: "bg-green-50 text-green-600" },
    { title: "Monitor Progress", icon: <FiEye />, color: "bg-purple-50 text-purple-600" }
  ];

  // Calculate success rate safely
  const successRate = resultStats.total > 0 
    ? ((resultStats.qualified / resultStats.total) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your platform today.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 text-lg font-semibold">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {(stat.value || 0).toLocaleString()}
                    </p>
                    <p className="text-green-600 text-sm font-medium mt-1">{stat.trend} from last week</p>
                  </div>
                  <div className={`${stat.color} text-white p-3 rounded-xl`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-4">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Charts and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-120">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FiTrendingUp className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
                    <p className="text-gray-600 text-sm">Key metrics and performance indicators</p>
                  </div>
                </div>
                <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      background: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorGradient)" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions & Pie Chart */}
            <div className="space-y-8">
  
              {/* Pie Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-120">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FiAward className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Results Analysis</h2>
                    <p className="text-gray-600 text-sm">Student performance breakdown</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Results:</span>
                    <span className="font-semibold">{resultStats.total || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-green-600">
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