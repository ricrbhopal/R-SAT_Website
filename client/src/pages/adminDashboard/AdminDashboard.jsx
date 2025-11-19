// File: AdminDashboard.jsx
import React from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import { FiMessageSquare } from "react-icons/fi"; // Corrected the import to use FiMessageSquare
import DashboardUsers from "./StudentRecordPage.jsx";

export default function AdminDashboard() {
  const items = [
    { id: "home", title: "Over View", icon: <FiMessageSquare />, node: <DashboardHome /> },
{ id: "users", title: "Student Record", icon: <FiMessageSquare />, node: <DashboardUsers /> },
  ];

  return (
    <div className="p-6 mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
