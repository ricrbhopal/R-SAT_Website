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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "#fff", padding: 8, border: "1px solid #ddd" }}>
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function OverView() {
  const [timeRange, setTimeRange] = useState("7days");

  return (
    <div className="space-y-6 p-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-gray-600">Your analytics at a glance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTimeRange("7days")} className="px-3 py-1 rounded bg-blue-500 text-white">7d</button>
          <button onClick={() => setTimeRange("30days")} className="px-3 py-1 rounded bg-gray-100">30d</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Explicit wrapper height */}
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-blue-500" />
            <h3 className="font-semibold">Registration Trend</h3>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="registrations" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referral Bar Chart */}
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiShare2 className="text-green-500" />
            <h3 className="font-semibold">Referrals</h3>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referralData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Registrations" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiMessageSquare className="text-orange-500" />
            <h3 className="font-semibold">Query Distribution</h3>
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                  {resultDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Result Distribution Pie / summary */}
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiAward className="text-purple-500" />
            <h3 className="font-semibold">Results</h3>
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {resultDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* small legend/summary */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {resultDistribution.map((r) => (
              <div key={r.name} className="p-2 rounded bg-gray-50">
                <div style={{ fontWeight: 700 }}>{r.value}</div>
                <div style={{ color: "#555", fontSize: 12 }}>{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
