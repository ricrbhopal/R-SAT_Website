import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiDownload,
  FiMail,
  FiAward,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import Profile from "./ProfilePage.jsx";
import Demo from "../candidateDashboard/BookDemoPage.jsx";
import Support from "../candidateDashboard/QueriesPage.jsx";
import Reffered from "./RefferedPage.jsx";
import AdmitCard from "./AdmitCardPage.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function CandidateDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Please login first to access the dashboard.");
      navigate("/RegistrationForm");
    }
  }, [navigate]);

  // quickActions declared inside component so we can reference it when initializing selection
  const quickActions = [
    {
      id: 1,
      title: "Profile",
      content: <Profile />,
      icon: <FiUser className="w-5 h-5 text-blue-600" />,
      accent: "bg-blue-100",
    },
    {
      id: 2,
      title: "Admit Card",
      content: <AdmitCard />,
      icon: <FiDownload className="w-5 h-5 text-red-600" />,
      accent: "bg-red-100",
    },
    {
      id: 3,
      title: "Results",
      content: <div className="p-4">Your Result details will appear here…</div>,
      icon: <FiAward className="w-5 h-5 text-green-600" />,
      accent: "bg-green-100",
    },
    {
      id: 4,
      title: "Referred",
      content: (
        <div className="p-4">
          <Reffered />
        </div>
      ),
      icon: <FiUsers className="w-5 h-5 text-pink-600" />,
      accent: "bg-pink-100",
    },
    {
      id: 5,
      title: "Book Demo Classes",
      content: <Demo />,
      icon: <FiCalendar className="w-5 h-5 text-purple-600" />,
      accent: "bg-purple-100",
    },
    {
      id: 6,
      title: "Help Center",
      content: <Support />,
      icon: <FiMail className="w-5 h-5 text-yellow-600" />,
      accent: "bg-yellow-100",
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

  useEffect(() => {
    // Ensure the Profile tab is always selected by default on login
    setSelectedId(1);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 p-4 justify-between max-auto sm:p-6 mt-15">
      <div className="max-w-7xl mx-auto mt-6">
        {/* Header */}
        <div className="mb-6 px-4 sm:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's your exam preparation overview
          </p>
        </div>

        {/* IMPORTANT CHANGE: Quick action cards shown horizontally at the TOP on desktop and remain horizontally scrollable on small screens. */}
        <div className="px-4 sm:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-6 md:gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedId(action.id)}
                aria-pressed={selectedId === action.id}
                className={`shrink-0 min-w-40 text-left p-4 cursor-pointer rounded-2xl border shadow-sm transition-transform duration-150 flex items-center gap-3
                    ${
                      selectedId === action.id
                        ? "bg-blue-50 border-blue-300 shadow"
                        : "bg-white border-gray-200 hover:shadow-md"
                    }`}
              >
                <div className={`p-2 rounded-lg ${action.accent}`}>
                  {action.icon}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {action.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content area sits below the horizontal card strip */}
        <div className="flex flex-col   mt-6">
          <main className="flex-1">
            <div className="bg-white rounded-2xl ">
              <div className="flex   mb-4">
                <div className="text-sm text-gray-500">
                  {selectedAction?.desc}
                </div>
              </div>

              <div className="mt-4">{selectedAction?.content}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
