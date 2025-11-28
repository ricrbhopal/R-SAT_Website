// File: AdminDashboard.jsx
import React from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import DashboardUsers from "./StudentRecordPage.jsx";
import DemoClass from "./DemoClassesPage.jsx"
import SupportManager from "./SupportManager.jsx";
import { PiStudentFill } from "react-icons/pi";
import RefferedPage from "./RefferedPage.jsx";

import { MdOutlineSupportAgent } from "react-icons/md";
import { BsGraphUpArrow } from "react-icons/bs";
import { PiGiftBold } from "react-icons/pi";
import { SiGoogleclassroom } from "react-icons/si";
import { FaIdCardAlt } from "react-icons/fa";
import AdmitCard from "./AdmitCardManagePage.jsx";
import { GrAchievement } from "react-icons/gr";
import ResultPage from "./ResultPage.jsx";
export default function AdminDashboard() {
  const items = [
    {
      id: "home",
      title: "Over View",
      icon: <BsGraphUpArrow />,
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
      icon: <PiGiftBold />,
      node: <RefferedPage />,
    },
    {
      id: "demo-classes",
      title: "Demo Classes",
      icon: <SiGoogleclassroom />,
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
      icon: <FaIdCardAlt />,
      node: <AdmitCard />,
    },
    {
      id: "results",
      title: "Results",
      icon: <GrAchievement />,
      node: <ResultPage />,
    },
  ];

  return (
    <div className=" mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
