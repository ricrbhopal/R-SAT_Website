// File: DashboardHome.jsx
import React, { useState } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiMessageSquare,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMinusCircle,
  FiShare2,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// Dummy data generators
const generateRegistrationData = (days = 7) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      registrations: Math.floor(Math.random() * 50) + 20,
      clicks: Math.floor(Math.random() * 200) + 100,
    });
  }
  return data;
};

const generateReferralData = () => {
  return [
    { name: "Rahul Sharma", clicks: 245, registrations: 45, conversion: 18.4 },
    { name: "Priya Singh", clicks: 189, registrations: 38, conversion: 20.1 },
    { name: "Amit Kumar", clicks: 167, registrations: 32, conversion: 19.2 },
    { name: "Neha Gupta", clicks: 142, registrations: 28, conversion: 19.7 },
    { name: "Sanjay Patel", clicks: 128, registrations: 25, conversion: 19.5 },
  ];
};

const generateResultData = () => {
  return {
    total: 1000,
    qualified: 650,
    absent: 120,
    failed: 230,
    rankDistribution: [
      { range: "1-10", students: 10 },
      { range: "11-50", students: 40 },
      { range: "51-100", students: 50 },
      { range: "101-200", students: 100 },
      { range: "201-500", students: 300 },
      { range: "501+", students: 500 },
    ],
  };
};

// ProgressBar Component - Added missing component
const ProgressBar = ({ percentage, color, label }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const StatCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p
            className={`text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last period
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-lg`}
        style={{ backgroundColor: `${color}20` }}
      >
        {React.cloneElement(icon, { size: 24, style: { color } })}
      </div>
    </div>
  </div>
);

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardHome() {
  const [timeRange, setTimeRange] = useState("7days");
  const [registrationData] = useState(generateRegistrationData(7));
  const [referralData] = useState(generateReferralData());
  const [resultData] = useState(generateResultData());

  // Define queryStats
  const queryStats = {
    open: 23,
    unresolved: 8,
    resolved: 15,
    avgResponseTime: "2.5 hours",
  };

  // Data for professional charts
  const performanceData = [
    { name: "Mon", registrations: 45, queries: 12 },
    { name: "Tue", registrations: 52, queries: 8 },
    { name: "Wed", registrations: 48, queries: 15 },
    { name: "Thu", registrations: 55, queries: 10 },
    { name: "Fri", registrations: 58, queries: 18 },
    { name: "Sat", registrations: 62, queries: 14 },
    { name: "Sun", registrations: 65, queries: 9 },
  ];

  const resultDistribution = [
    { name: "Qualified", value: 650, color: "#10B981" },
    { name: "Failed", value: 230, color: "#EF4444" },
    { name: "Absent", value: 120, color: "#F59E0B" },
  ];

  const referralChartData = referralData.map((item) => ({
    name: item.name,
    Clicks: item.clicks,
    Registrations: item.registrations,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your platform performance and student statistics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("7days")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              timeRange === "7days"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange("30days")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              timeRange === "30days"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Registrations"
          value="1,247"
          change={12.5}
          icon={<FiUsers />}
          color="#3B82F6"
        />
        <StatCard
          title="Active Queries"
          value={queryStats.open}
          change={-5.2}
          icon={<FiMessageSquare />}
          color="#F59E0B"
        />
        <StatCard
          title="Qualified Students"
          value={resultData.qualified}
          change={8.7}
          icon={<FiAward />}
          color="#10B981"
        />
        <StatCard
          title="Avg Response Time"
          value={queryStats.avgResponseTime}
          change={-15.3}
          icon={<FiClock />}
          color="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend Chart - Enhanced with Area Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" />
              Registration Trend
            </h2>
          </div>
          <div className="space-y-4">
            <ResponsiveContainer
              width="100%"
              height={300}
              minWidth={300}
              minHeight={200}
            >
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Registrations"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-gray-600">Total Registrations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">+12.5%</p>
                <p className="text-sm text-gray-600">Growth Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">8,452</p>
                <p className="text-sm text-gray-600">Total Clicks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">14.7%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Query Analytics - Enhanced with Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <FiMessageSquare className="text-orange-500" />
            Query Analytics
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {queryStats.open}
                </p>
                <p className="text-sm text-gray-600">Open Queries</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {queryStats.unresolved}
                </p>
                <p className="text-sm text-gray-600">Unresolved</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {queryStats.resolved}
                </p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>

            {/* Pie Chart for Query Distribution */}
            <div className="h-48">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={200}
                minHeight={200}
              >
                <PieChart>
                  <Pie
                    data={[
                      { name: "Resolved", value: queryStats.resolved, color: "#10B981" },
                      { name: "Unresolved", value: queryStats.unresolved, color: "#EF4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: "Resolved", value: queryStats.resolved, color: "#10B981" },
                      { name: "Unresolved", value: queryStats.unresolved, color: "#EF4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Response Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {queryStats.avgResponseTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Performance - Enhanced with Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <FiShare2 className="text-green-500" />
            Referral Performance
          </h2>
          <div className="space-y-4">
            <ResponsiveContainer
              width="100%"
              height={200}
              minWidth={300}
              minHeight={200}
            >
              <BarChart data={referralChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Clicks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Registrations" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
              {referralData.map((referrer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referrer.name}</p>
                      <p className="text-sm text-gray-500">
                        {referrer.clicks} clicks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {referrer.registrations} registrations
                    </p>
                    <p className="text-sm text-green-600">
                      {referrer.conversion}% conversion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result/Exam Stats - Enhanced with Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <FiAward className="text-purple-500" />
            Result/Exam Stats
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <FiCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
                <p className="text-xl font-bold text-green-600">
                  {resultData.qualified}
                </p>
                <p className="text-sm text-gray-600">Qualified</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <FiMinusCircle className="text-yellow-500 text-2xl mx-auto mb-2" />
                <p className="text-xl font-bold text-yellow-600">
                  {resultData.absent}
                </p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <FiXCircle className="text-red-500 text-2xl mx-auto mb-2" />
                <p className="text-xl font-bold text-red-600">
                  {resultData.failed}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>

            {/* Result Distribution Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={200}
                minHeight={200}
              >
                <PieChart>
                  <Pie
                    data={resultDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resultDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Ranking Distribution
              </h3>
              <div className="space-y-2">
                {resultData.rankDistribution.map((rank, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">Rank {rank.range}</span>
                    <span className="font-medium text-gray-900">
                      {rank.students} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}