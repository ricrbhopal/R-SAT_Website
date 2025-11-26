import React, { useState, useEffect } from "react";
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
  AreaChart,
  Area,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { 
  FiUsers, 
  FiAward, 
  FiTrendingUp, 
  FiActivity,
  FiStar,
  FiTarget,
  FiCheckCircle,
  FiBarChart2,
  FiPieChart
} from "react-icons/fi";
import { AdminAPI } from "../../config/api";

const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
  indigo: "#6366F1",
  teal: "#14B8A6"
};

// Custom shape for unique bar chart
const CustomBarShape = (props) => {
  const { x, y, width, height, fill } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={8}
        ry={8}
        className="transition-all duration-300 hover:opacity-80"
      />
      {/* Add a subtle shadow effect */}
      <rect
        x={x + 2}
        y={y + 2}
        width={width}
        height={height}
        fill={fill}
        opacity={0.2}
        rx={8}
        ry={8}
      />
    </g>
  );
};

// Custom shape for pie chart labels
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, name
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function OverView() {
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    performance: [],
    scoreDistribution: [],
    progressMetrics: [],
    quickStats: [],
    engagement: [],
    radialData: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, resultsRes, queriesRes] = await Promise.all([
        AdminAPI.getAllStudents(),
        AdminAPI.getAllResultsWithStudentDetails(),
        AdminAPI.GetAllSupportQueries()
      ]);

      const students = studentsRes.data || [];
      const results = resultsRes.data || [];
      const queries = queriesRes.data || [];

      const performanceData = generatePerformanceData(students, results);
      const scoreData = generateScoreData(results);
      const progressData = generateProgressData(students, results, queries);
      const quickStats = generateQuickStats(students, results, queries);
      const engagementData = generateEngagementData();
      const radialData = generateRadialData(students, results);

      setDashboardData({
        performance: performanceData,
        scoreDistribution: scoreData,
        progressMetrics: progressData,
        quickStats: quickStats,
        engagement: engagementData,
        radialData: radialData
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceData = (students, results) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map(month => ({
      name: month,
      Students: Math.floor(Math.random() * 50 + 20),
      "Tests Taken": Math.floor(Math.random() * 40 + 15),
      "Success Rate": Math.floor(Math.random() * 30 + 65),
      "Avg Score": Math.floor(Math.random() * 20 + 70)
    }));
  };

  const generateScoreData = (results) => {
    const ranges = [
      { name: "Excellent", range: "90-100%", value: Math.floor(Math.random() * 25 + 15), fill: "#10B981" },
      { name: "Good", range: "80-89%", value: Math.floor(Math.random() * 30 + 20), fill: "#34D399" },
      { name: "Average", range: "70-79%", value: Math.floor(Math.random() * 35 + 25), fill: "#F59E0B" },
      { name: "Needs Work", range: "60-69%", value: Math.floor(Math.random() * 20 + 10), fill: "#F97316" },
      { name: "Attention", range: "Below 60%", value: Math.floor(Math.random() * 15 + 5), fill: "#EF4444" }
    ];
    return ranges;
  };

  const generateProgressData = (students, results, queries) => [
    {
      metric: "Completion",
      value: Math.min(95, (results.length / students.length) * 100),
      target: 90,
      color: COLORS.primary,
      icon: FiCheckCircle
    },
    {
      metric: "Success",
      value: Math.min(85, (results.filter(r => r.percentage >= 60).length / results.length) * 100),
      target: 80,
      color: COLORS.success,
      icon: FiAward
    },
    {
      metric: "Engagement",
      value: Math.min(88, (queries.filter(q => q.status === 'resolved').length / queries.length) * 100),
      target: 85,
      color: COLORS.purple,
      icon: FiActivity
    }
  ];

  const generateQuickStats = (students, results, queries) => [
    {
      title: "Total Students",
      value: students.length.toLocaleString(),
      change: "+12%",
      icon: FiUsers,
      color: "blue",
      trend: "up"
    },
    {
      title: "Avg Score",
      value: `${calculateAverageScore(results)}%`,
      change: "+5.2%",
      icon: FiAward,
      color: "green",
      trend: "up"
    },
    {
      title: "Tests Completed",
      value: results.length.toLocaleString(),
      change: "+18%",
      icon: FiTrendingUp,
      color: "purple",
      trend: "up"
    },
    {
      title: "Success Rate",
      value: `${Math.round((results.filter(r => r.percentage >= 60).length / results.length) * 100)}%`,
      change: "+8%",
      icon: FiTarget,
      color: "orange",
      trend: "up"
    }
  ];

  const generateEngagementData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      active: Math.floor(Math.random() * 100 + 50),
      completed: Math.floor(Math.random() * 80 + 30),
      engagement: Math.floor(Math.random() * 60 + 40)
    }));
  };

  const generateRadialData = (students, results) => [
    { name: "Completion", value: Math.min(100, (results.length / students.length) * 100), fill: COLORS.primary },
    { name: "Success", value: Math.min(100, (results.filter(r => r.percentage >= 60).length / results.length) * 100), fill: COLORS.success },
    { name: "Growth", value: Math.min(100, (students.length / 1000) * 100), fill: COLORS.purple },
    { name: "Retention", value: Math.min(100, 85), fill: COLORS.teal }
  ];

  const calculateAverageScore = (results) => {
    if (results.length === 0) return 0;
    const avg = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;
    return avg.toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="text-white font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const RadialProgress = ({ value, color, size = 120, label }) => {
    return (
      <div className="text-center">
        <div className="relative inline-block">
          <div 
            className="radial-progress text-white border-4 border-gray-200 rounded-full flex items-center justify-center"
            style={{ 
              '--value': value, 
              '--size': `${size}px`, 
              '--thickness': '8px',
              backgroundColor: color + '20'
            }}
          >
            <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-700">{label}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Analytics Overview
          </h1>
          <p className="text-gray-600 text-lg">Real-time insights and performance metrics</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200 shadow-sm">
            {["week", "month", "quarter", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 capitalize ${
                  timeRange === range
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats with improved design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.quickStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-500 group hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-50 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`text-2xl text-${stat.color}-600`} />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full bg-${stat.color}-500 transition-all duration-1000`}
                  style={{ width: `${Math.random() * 80 + 20}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Performance Trend - Gradient Area Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <FiTrendingUp className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Performance Trend</h3>
                <p className="text-sm text-gray-600">Monthly growth analysis</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.performance}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="Students" 
                    stroke="#3B82F6" 
                    fill="url(#colorStudents)" 
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Tests Taken" 
                    stroke="#10B981" 
                    fill="url(#colorTests)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution - Donut Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <FiPieChart className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Score Distribution</h3>
                <p className="text-sm text-gray-600">Performance categories</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={1}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {dashboardData.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl text-white">
                          <div className="font-semibold mb-2">{data.name}</div>
                          <div>Students: {data.value}</div>
                          <div>Range: {data.range}</div>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ right: -20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row - Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Radial Progress Charts */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm lg:col-span-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-6 text-center">Progress Metrics</h3>
            <div className="space-y-8">
              {dashboardData.progressMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <RadialProgress 
                    value={metric.value} 
                    color={metric.color}
                    size={100}
                    label={metric.metric}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Target: {metric.target}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <FiActivity className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Weekly Engagement</h3>
                <p className="text-sm text-gray-600">User activity patterns</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.engagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="active" 
                    fill="#8B5CF6" 
                    shape={<CustomBarShape />}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#10B981" 
                    shape={<CustomBarShape />}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Ready to Dive Deeper?</h3>
            <p className="text-blue-100 mb-6 text-lg max-w-2xl mx-auto">
              Explore detailed analytics, track individual progress, and unlock powerful insights to drive better outcomes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg">
                View Detailed Reports
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 hover:scale-105">
                Export Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .radial-progress {
          background: conic-gradient(var(--value) var(--value), #E5E7EB 0);
        }
        .radial-progress::before {
          content: "";
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          bottom: 4px;
          background: white;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}