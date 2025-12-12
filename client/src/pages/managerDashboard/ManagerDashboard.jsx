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
          Select an option from the sidebar.
        </div>
      );
  }
}

export default function ManagerDashboard() {
  const [active, setActive] = useState("home");
  
  return (
    <div className="flex h-screen mt-18 bg-gray-900 text-gray-100">
      {/* Sidebar - Dark theme */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 shadow-lg">
        <SideBar 
          active={active} 
          setActive={setActive} 
          className="cursor-pointer text-gray-200 hover:text-white" 
        />
      </div>
      
      {/* Main Content Area - Dark theme */}
      <div className="flex-1 p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-auto">
        <Content active={active} />
      </div>
    </div>
  );
}
