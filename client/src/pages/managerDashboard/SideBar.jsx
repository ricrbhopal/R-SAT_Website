// SideBar.jsx
import React, { useState } from "react";
import { FiMenu, FiX, FiChevronLeft, FiChevronRight, FiBarChart2, FiUsers, FiMessageSquare, FiTrash2 } from "react-icons/fi";

export const menuItems = [
  { key: "overView", label: "Overview", icon: FiBarChart2 },
  { key: "manage", label: "Manage", icon: FiUsers },
  { key: "supportManager", label: "Support Manager", icon: FiMessageSquare },
  { key: "trashBin", label: "Trash Bin", icon: FiTrash2 },
];

export default function SideBar({ active, setActive }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleItemClick = (key) => {
    setActive(key);
    setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900/90 text-white rounded-lg border border-gray-700/50 shadow-lg"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 h-full bg-gray-900/95 backdrop-blur-sm text-gray-100 w-64"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="p-6 text-xl font-bold bg-gray-900/80 border-b border-gray-700/50 flex justify-between items-center">
              <span className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 bg-clip-text text-transparent font-black tracking-tight">
                Manager Dashboard
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-gray-800/50 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 p-6">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <button
                        className={`group block w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer relative font-medium  ${
                          active === item.key 
                            ? "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 text-white border border-emerald-500/30 shadow-sm shadow-emerald-500/20 backdrop-blur-sm"
                            : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 hover:border hover:border-gray-600/50 hover:shadow-sm"
                        }`}
                        onClick={() => handleItemClick(item.key)}
                      >
                        {active === item.key && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-r-full shadow-sm" />
                        )}
                        
                        <span className="flex items-center space-x-3">
                          <span className="text-lg"><Icon className="w-5 h-5 " /></span>
                          <span>{item.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen bg-gray-900/95 backdrop-blur-sm text-gray-100 border-r border-gray-700/50 shadow-xl relative`}>
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 p-1.5 bg-gray-800 border border-gray-700  cursor-pointer rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200 z-20 shadow-lg"
        >
          {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
        
        {/* Header */}
        <div className={`p-6 text-xl font-bold bg-gray-900/80 border-b border-gray-700/50 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? (
            <span className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 bg-clip-text text-transparent font-black tracking-tight text-lg">
              M
            </span>
          ) : (
            <span className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 bg-clip-text text-transparent font-black tracking-tight">
              Manager Dashboard
            </span>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <button
                    className={`group block w-full text-left ${isCollapsed ? 'px-3 justify-center' : 'px-4'} py-3 rounded-lg transition-all duration-200 cursor-pointer relative font-medium ${
                      active === item.key 
                        ? "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 text-white border border-emerald-500/30 shadow-sm shadow-emerald-500/20 backdrop-blur-sm"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 hover:border hover:border-gray-600/50 hover:shadow-sm"
                    }`}
                    onClick={() => handleItemClick(item.key)}
                    title={isCollapsed ? item.label : ''}
                  >
                    {active === item.key && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-r-full shadow-sm" />
                    )}
                    
                    <span className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                      <span className="text-lg"><Icon className="w-5 h-5" /></span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
