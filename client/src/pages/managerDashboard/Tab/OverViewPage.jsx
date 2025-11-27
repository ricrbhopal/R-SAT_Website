import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const barData = [
  { name: "Mon", users: 30 },
  { name: "Tue", users: 45 },
  { name: "Wed", users: 28 },
  { name: "Thu", users: 50 },
  { name: "Fri", users: 40 },
  { name: "Sat", users: 35 },
  { name: "Sun", users: 20 },
];

const pieData = [
  { name: "Active", value: 400, color: "#10B981" },
  { name: "Inactive", value: 200, color: "#EF4444" },
  { name: "Pending", value: 100, color: "#F59E0B" },
];

export default function OverViewPage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Overview</h1>
      <p className="text-gray-500 mb-6">Quick analytics snapshot for managers</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">User Activity (Weekly)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">User Status</h2>
          <ResponsiveContainer width="100%" height={250}>
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
        </div>
      </div>
    </div>
  );
}
