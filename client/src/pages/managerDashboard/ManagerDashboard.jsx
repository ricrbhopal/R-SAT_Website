// ManagerDashboard.jsx
import React, { useState } from "react";
import OverView from "./Tab/overViewPage.jsx";
import Manager from "./Tab/manager.jsx";
import TrushBin from "./Tab/trushBinPage.jsx";
import Support from "./Tab/supportQuery.jsx";
import SideBar, { menuItems } from "./SideBar";

function Content({ active }) {
  switch (active) {
    case "overView":
      return <OverView />;
    case "manage":
      return <Manager />;
    case "supportManager":
      return <Support />;
    case "trashBin":
      return <TrushBin />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center p-8">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to Manager Dashboard</h3>
            <p className="text-gray-400">Select an option from the sidebar to get started</p>
          </div>
        </div>
      );
  }
}

export default function ManagerDashboard() {
  const [active, setActive] = useState("overView");
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 mt-16 ">
      {/* Sidebar */}
      <SideBar 
        active={active} 
        setActive={setActive} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mt-16 lg:mt-0">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {menuItems.find(item => item.key === active)?.label || "Dashboard"}
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
        </div>
        
        <Content active={active} />
      </div>
    </div>
  );
}