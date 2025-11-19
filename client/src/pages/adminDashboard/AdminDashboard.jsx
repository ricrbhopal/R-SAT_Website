// File: AdminDashboard.jsx
import React from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import DashboardUsers from "./StudentRecordPage.jsx"
import { MdOutlineDashboard } from "react-icons/md";;
import { PiStudentFill } from "react-icons/pi";
export default function AdminDashboard() {
  const items = [
    { id: "home", title: "Over View", icon: <MdOutlineDashboard />, node: <DashboardHome /> },
{ id: "users", title: "Student Record", icon: <PiStudentFill />, node: <DashboardUsers /> },
  ];

  return (
    <div className="p-6 mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
