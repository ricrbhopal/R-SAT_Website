// File: AdminDashboard.jsx
import React from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import DashboardUsers from "./StudentRecordPage.jsx";
import { MdOutlineDashboard } from "react-icons/md";
import { PiStudentFill } from "react-icons/pi";
import RefferedPage from "./RefferedPage.jsx";
import { CiLink } from "react-icons/ci";
export default function AdminDashboard() {
  const items = [
    {
      id: "home",
      title: "Over View",
      icon: <MdOutlineDashboard />,
      node: <DashboardHome />,
    },
    {
      id: "users",
      title: "Student Record",
      icon: <PiStudentFill />,
      node: <DashboardUsers />,
    },
    {
      id: "referrals",
      title: "Referral Records",
      icon: <CiLink  className="font-bold" size={22}/>,
      node: <RefferedPage />,
    },
  ];

  return (
    <div className="p-6 mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
