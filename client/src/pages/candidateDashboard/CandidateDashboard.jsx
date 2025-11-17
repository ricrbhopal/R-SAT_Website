import React from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiDownload,
  FiMail,
  FiArrowRight,
  FiAward,
FiUsers,
FiCalendar,
} from "react-icons/fi";

export default function CandidateDashboard() {
  const quickActions = [
    {
      id: 1,
      title: "Profile Management",
      desc: "Update personal information and preferences",
      to: "/candidate/profile",
      icon: <FiUser className="w-5 h-5 text-blue-600" />,
      accent: "bg-blue-100",
      buttonText: "Manage",
    },
    {
      id: 2,
      title: "Admit Card",
      desc: "Download hall ticket for upcoming exams",
      to: "/candidate/admit-card",
      icon: <FiDownload className="w-5 h-5 text-red-600" />,
      accent: "bg-red-100",
      buttonText: "Download",
    },
    {
      id: 3,
      title: "Results",
      desc: "Check your performance and scorecards",
      to: "/candidate/results",
      icon: <FiAward className="w-5 h-5 text-green-600" />,
      accent: "bg-green-100",
      buttonText: "Check",
    },
    {
      id: 4,
      title: "Referred",
      desc: "Manage your referred candidates",
      to: "/candidate/referred",
      icon: <FiUsers className="w-5 h-5 text-pink-600" />,
      accent: "bg-pink-100",
      buttonText: "Manage",
    },
    {
      id: 5,
      title: "Book Demo Classes",
      desc: "Schedule and attend demo sessions",
      to: "/candidate/demo-classes",
      icon: <FiCalendar className="w-5 h-5 text-purple-600" />,
      accent: "bg-purple-100",
      buttonText: "Book",
    },

    {
      id: 6,
      title: "Support Queries",
      desc: "Get help and support for your issues",
      to: "/candidate/queries",
      icon: <FiMail className="w-5 h-5 text-yellow-600" />,
      accent: "bg-yellow-100",
      buttonText: "Support",
    },
  ];

  return (
    <div className="min-h-screen  bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6 mt-10">
      <div className="max-w-7xl mx-auto mt-12 ">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between ml-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Candidate Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back! Here's your exam preparation overview
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Quick Actions
                </h2>
                <Link
                  to="/candidate/all-features"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link
                    to={action.to}
                    key={action.id}
                    className="group block p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2 bg-gradient-to-br ${action.accent} rounded-lg text-white`}
                      >
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {action.buttonText}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{action.desc}</p>

                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <span>Access now</span>
                      <FiArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
