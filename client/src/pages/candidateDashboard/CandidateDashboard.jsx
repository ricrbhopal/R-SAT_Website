// CandidateDashboardPersistent.jsx
import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiDownload,
  FiMail,
  FiArrowRight,
  FiAward,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import Profile from "./ProfilePage.jsx";

export default function CandidateDashboard() {
  // quickActions declared inside component so we can reference it when initializing selection
  const quickActions = [
    {
      id: 1,
      title: "Profile Management",
      desc: "Update personal information and preferences",
      content: <Profile />,
      icon: <FiUser className="w-5 h-5 text-blue-600" />,
      accent: "bg-blue-100",
      // buttonText: "Manage",
    },
    {
      id: 2,
      title: "Admit Card",
      desc: "Download hall ticket for upcoming exams",
      content: <div className="p-4">Your Admit Card will appear here…</div>,
      icon: <FiDownload className="w-5 h-5 text-red-600" />,
      accent: "bg-red-100",
      // buttonText: "Download",
    },
    {
      id: 3,
      title: "Results",
      desc: "Check your performance and scorecards",
      content: <div className="p-4">Your Result details will appear here…</div>,
      icon: <FiAward className="w-5 h-5 text-green-600" />,
      accent: "bg-green-100",
      // buttonText: "Check",
    },
    {
      id: 4,
      title: "Referred",
      desc: "Manage your referred candidates",
      content: (
        <div className="p-4">
          All your referred candidates will appear here…
        </div>
      ),
      icon: <FiUsers className="w-5 h-5 text-pink-600" />,
      accent: "bg-pink-100",
      // buttonText: "Manage",
    },
    {
      id: 5,
      title: "Book Demo Classes",
      desc: "Schedule and attend demo sessions",
      content: <div className="p-4">Book your demo class here…</div>,
      icon: <FiCalendar className="w-5 h-5 text-purple-600" />,
      accent: "bg-purple-100",
      // buttonText: "Book",
    },
    {
      id: 6,
      title: "Support Queries",
      desc: "Get help and support for your issues",
      content: (
        <div className="p-4">Support queries & FAQs will appear here…</div>
      ),
      icon: <FiMail className="w-5 h-5 text-yellow-600" />,
      accent: "bg-yellow-100",
      // buttonText: "Support",
    },
  ];

  // localStorage key
  const STORAGE_KEY = "candidate_selected_action";

  // initialize selected id from localStorage or default to profile (id:1)
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : null;
      if (parsed && quickActions.some((q) => q.id === parsed)) return parsed;
    } catch (e) {
      // ignore localStorage errors (e.g. SSR) and fallback
    }
    return 1; // default to Profile card
  });

  // persist selectedId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(selectedId));
    } catch (e) {
      // ignore
    }
  }, [selectedId]);

  // get the selected action object
  const selectedAction = quickActions.find((q) => q.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6 mt-10">
      <div className="max-w-8xl mx-auto mt-12">
        {/* Header */}
        <div className="mb-8 ml-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's your exam preparation overview
          </p>
        </div>

        <div className=" ">
          {/* Left column: Quick Action Buttons (list) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>

              <div className="flex flex-row gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedId(action.id)}
                    className={`group w-full text-left p-4 border rounded-xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between
                      ${
                        selectedId === action.id
                          ? "bg-blue-50 border-blue-300 shadow"
                          : "bg-white border-gray-200 hover:shadow-lg hover:-translate-y-0.5"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.accent}`}>
                        {action.icon}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">{action.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Content area (stays on same page) */}
        <div className="mt-10">
          <div className="bg-white rounded-2xl shadow p-6 min-h-[320px]">
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedAction?.title}
              </h2>
              <div className="text-sm text-gray-500">
                {selectedAction?.desc}
              </div>
            </div>

            {/* Content */}
            <div className="mt-4">{selectedAction?.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
