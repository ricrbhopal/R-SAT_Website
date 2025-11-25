// OverView.jsx
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FiTrendingUp, FiMessageSquare, FiShare2, FiAward } from "react-icons/fi";

/* dummy data (use your real data if available) */
const performanceData = [
  { name: "Mon", registrations: 45, queries: 12 },
  { name: "Tue", registrations: 52, queries: 8 },
  { name: "Wed", registrations: 48, queries: 15 },
  { name: "Thu", registrations: 55, queries: 10 },
  { name: "Fri", registrations: 58, queries: 18 },
  { name: "Sat", registrations: 62, queries: 14 },
  { name: "Sun", registrations: 65, queries: 9 },
];

const referralData = [
  { name: "Rahul Sharma", Clicks: 245, Registrations: 45 },
  { name: "Priya Singh", Clicks: 189, Registrations: 38 },
  { name: "Amit Kumar", Clicks: 167, Registrations: 32 },
  { name: "Neha Gupta", Clicks: 142, Registrations: 28 },
  { name: "Sanjay Patel", Clicks: 128, Registrations: 25 },
];

const resultDistribution = [
  { name: "Qualified", value: 650, color: "#10B981" },
  { name: "Failed", value: 230, color: "#EF4444" },
  { name: "Absent", value: 120, color: "#F59E0B" },
];

const queryDistribution = [
  { name: "Technical", value: 45, color: "#8B5CF6" },
  { name: "Payment", value: 30, color: "#F59E0B" },
  { name: "General", value: 25, color: "#3B82F6" },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
      <strong className="text-gray-900">{label}</strong>
      {payload.map((p, i) => (
        <div key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function OverView() {
  const [timeRange, setTimeRange] = useState("7days");
  const [containerReady, setContainerReady] = useState(false);

  // Ensure containers are properly sized
  React.useEffect(() => {
    setContainerReady(true);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-4 lg:p-6 min-w-0">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Your analytics at a glance</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={() => setTimeRange("7days")} 
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
              timeRange === "7days" 
                ? "bg-blue-500 text-white shadow-sm" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            7 Days
          </button>
          <button 
            onClick={() => setTimeRange("30days")} 
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
              timeRange === "30days" 
                ? "bg-blue-500 text-white shadow-sm" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            30 Days
          </button>
        </div>
      </header>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 min-w-0">
        {/* Area Chart - Registration Trend */}
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FiTrendingUp className="text-blue-500 text-lg md:text-xl" />
            <h3 className="font-semibold text-sm md:text-base text-gray-900">Registration Trend</h3>
          </div>
          <div className="w-full h-[280px] sm:h-[300px] md:h-[320px] min-h-[200px]">
            {containerReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart 
                  data={performanceData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart - Referrals */}
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FiShare2 className="text-green-500 text-lg md:text-xl" />
            <h3 className="font-semibold text-sm md:text-base text-gray-900">Referrals</h3>
          </div>
          <div className="w-full h-[240px] sm:h-[260px] md:h-[280px] min-h-[200px]">
            {containerReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart 
                  data={referralData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
                  <Bar 
                    dataKey="Clicks" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]}
                    name="Clicks"
                  />
                  <Bar 
                    dataKey="Registrations" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                    name="Registrations"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart - Query Distribution */}
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FiMessageSquare className="text-orange-500 text-lg md:text-xl" />
            <h3 className="font-semibold text-sm md:text-base text-gray-900">Query Distribution</h3>
          </div>
          <div className="w-full h-[200px] sm:h-[220px] md:h-[240px] min-h-[150px]">
            {containerReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie 
                    data={queryDistribution} 
                    dataKey="value" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 40} 
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 80} 
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {queryDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '10px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart - Results Distribution */}
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FiAward className="text-purple-500 text-lg md:text-xl" />
            <h3 className="font-semibold text-sm md:text-base text-gray-900">Results</h3>
          </div>
          <div className="w-full h-[200px] sm:h-[220px] md:h-[240px] min-h-[150px]">
            {containerReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie 
                    data={resultDistribution} 
                    dataKey="value" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 80} 
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {resultDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
            {resultDistribution.map((r) => (
              <div 
                key={r.name} 
                className="p-2 sm:p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div 
                  className="font-bold text-sm sm:text-base" 
                  style={{ color: r.color }}
                >
                  {r.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  {r.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Optimization Note */}
      <div className="lg:hidden text-center">
        <p className="text-xs text-gray-500">
          Tip: Rotate your device horizontally for better chart visibility
        </p>
      </div>
    </div>
  );
}