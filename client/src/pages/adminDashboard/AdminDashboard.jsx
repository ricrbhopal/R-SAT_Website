// File: AdminDashboard.jsx
import React from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import DashboardUsers from "./StudentRecordPage.jsx";
import DemoClass from "./DemoClassesPage.jsx"
import SupportManager from "./SupportManager.jsx";
import { MdOutlineDashboard } from "react-icons/md";
import { PiStudentFill } from "react-icons/pi";
import RefferedPage from "./RefferedPage.jsx";
import { CiLink } from "react-icons/ci";
import {FaChalkboardTeacher} from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import AdmitCard from "./AdmitCardManagePage.jsx";
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
    {
      id: "demo-classes",
      title: "Demo Classes",
      icon: <FaChalkboardTeacher className="font-bold" size={22}/>,
      node: <DemoClass />,
    },
    {
      id: "support-manager",
      title: "Support Manager",
      icon: <MdOutlineSupportAgent className="font-bold" size={22} />,
      node: <SupportManager />,
    },
    {
      id: "admit-card",
      title: "Admit Card",
      icon: <MdOutlineDashboard />,
      node: <AdmitCard />,
    },
  ];

  return (
    <div className=" mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
