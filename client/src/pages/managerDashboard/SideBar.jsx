import React from "react";

export const menuItems = [
  { key: "overView", label: "Over View" },
  { key: "manage", label: "Manage" },
  { key: "supportManager", label: "Support Manager" },
  { key: "trashBin", label: "Trash Bin" },
];

export default function SideBar({ active, setActive }) {
  return (
    <div className="w-64 min-h-screen bg-gray-900/95 backdrop-blur-sm text-gray-100 flex flex-col border-r border-gray-700/50 shadow-xl">
      {/* Header */}
      <div className="p-6 text-xl font-bold bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-10">
        <span className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 bg-clip-text text-transparent font-black tracking-tight">
          Manager Dashboard
        </span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                className={`group block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer relative font-medium ${
                  active === item.key 
                    ? "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 text-white border border-emerald-500/30 shadow-sm shadow-emerald-500/20 backdrop-blur-sm"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 hover:border hover:border-gray-600/50 hover:shadow-sm"
                }`}
                onClick={() => setActive(item.key)}
              >
                {/* Active indicator */}
                {active === item.key && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-r-full shadow-sm" />
                )}
                
                {/* Label with hover effect */}
                <span className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    active === item.key 
                      ? "bg-gradient-to-r from-emerald-400 to-blue-400 scale-125 shadow-md" 
                      : "bg-gray-600/50 group-hover:bg-gray-400/70 group-hover:scale-110"
                  }`} />
                  <span>{item.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
