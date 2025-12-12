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
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent tracking-tight mb-2">
          Overview
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Quick analytics snapshot for managers
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl hover:shadow-slate-900/50 transition-all duration-300 group">
          <h2 className="text-xl font-bold text-slate-100 mb-6 tracking-tight">User Activity (Weekly)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--slate-800)/0.3)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 14, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'hsl(var(--slate-900))',
                  border: '1px solid hsl(var(--slate-800))',
                  borderRadius: '12px',
                  color: '#F1F5F9'
                }}
              />
              <Bar 
                dataKey="users" 
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                className="group-hover:scale-[1.02] transition-transform duration-300"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.9} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/50 shadow-2xl hover:shadow-slate-900/50 transition-all duration-300">
          <h2 className="text-xl font-bold text-slate-100 mb-6 tracking-tight">User Status Distribution</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                cornerRadius={8}
                label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} strokeWidth={3} stroke="hsl(var(--slate-950))" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  background: 'hsl(var(--slate-900))',
                  border: '1px solid hsl(var(--slate-800))',
                  borderRadius: '12px',
                  color: '#F1F5F9'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#CBD5E1', fontSize: '14px', fontWeight: 500 }}
                iconSize={16}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-800/50">
        <div className="group bg-gradient-to-br from-emerald-900/60 to-emerald-800/60 backdrop-blur-xl rounded-2xl p-8 border border-emerald-700/50 hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="text-3xl mb-2">📈</div>
          <h3 className="text-slate-100 font-bold text-xl mb-2">Total Users</h3>
          <div className="text-4xl font-black text-emerald-300">720</div>
          <p className="text-emerald-200 text-sm mt-2">+12% from last week</p>
        </div>

        <div className="group bg-gradient-to-br from-indigo-900/60 to-indigo-800/60 backdrop-blur-xl rounded-2xl p-8 border border-indigo-700/50 hover:shadow-2xl hover:shadow-indigo-900/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-slate-100 font-bold text-xl mb-2">Active Sessions</h3>
          <div className="text-4xl font-black text-indigo-300">400</div>
          <p className="text-indigo-200 text-sm mt-2">Peak: 450 today</p>
        </div>

        <div className="group bg-gradient-to-br from-amber-900/60 to-amber-800/60 backdrop-blur-xl rounded-2xl p-8 border border-amber-700/50 hover:shadow-2xl hover:shadow-amber-900/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="text-3xl mb-2">📱</div>
          <h3 className="text-slate-100 font-bold text-xl mb-2">Conversion Rate</h3>
          <div className="text-4xl font-black text-amber-300">58.3%</div>
          <p className="text-amber-200 text-sm mt-2">Target: 60%</p>
        </div>
      </div>
    </div>
  );
}

