import React, { useState } from "react";
import OverView from "./Tab/OverViewPage";
import OneClick from "./Tab/OneClickPage";
import TrushBin from "./Tab/TrushBinPage";
import Student from "./Tab/StudentPage";

const menuItems = [
  { key: "home", label: "Dashboard Home" },
  { key: "reports", label: "Reports" },
  { key: "team", label: "Team Management" },
  { key: "settings", label: "Settings" },
];

function SideBar({ active, setActive }) {
  return (
    <div className="w-64 h-min-screen h- bg-gray-800 text-white flex flex-col mt-18">
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Manager Dashboard
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-4">
          {menuItems.map(item => (
            <li key={item.key}>
              <button
                className={`block w-full text-left px-4 py-2 rounded transition cursor-pointer ${
                  active === item.key ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
                onClick={() => setActive(item.key)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Content({ active }) {
  switch (active) {
    case "home":
      return <OverView />;
    case "reports":
      return <OneClick />;
    case "team":
      return <Student />;
    case "settings":
      return <TrushBin />;
    default:
      return <div>Select an option from the sidebar.</div>;
  }
}

export default function ManagerDashboard() {
  const [active, setActive] = useState("home");
  return (
    <div className="flex h-screen">
      <SideBar active={active} setActive={setActive} className="cursor-pointer" />
      <div className="flex-1 p-8 bg-gray-50 mt-15">
        <Content active={active} />
      </div>
    </div>
  );
}
