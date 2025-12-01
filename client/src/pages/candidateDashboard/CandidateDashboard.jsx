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
import { AuthAPI } from "../../config/api.js";

export default function CandidateDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ----- Hooks must run unconditionally (placed before any early returns) -----

  // fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await AuthAPI.getStudentProfile();
        const payload = response?.data;
        setProfile(payload?.student || payload || {});
      } catch (err) {
        setError("Failed to fetch profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // check token and redirect if not logged in
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(selectedId));
    } catch (e) {
      // ignore
    }
  }, [selectedId]);

  // get the selected action object
  const selectedAction = quickActions.find((q) => q.id === selectedId);

  // (optional) Ensure the Profile tab is always selected by default on mount
  useEffect(() => {
    setSelectedId(1);
  }, []);

  // ----- Conditional UI for loading / error -----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Profile
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 p-4 justify-between max-auto sm:p-6 mt-15">
      <div className="max-w-7xl mx-auto mt-6">
        {/* Header */}
        <div className="mb-6 px-4 sm:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile?.fullName ?? "Your Name"}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's your exam preparation overview
          </p>
        </div>

        {/* Quick action cards */}
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

        {/* Main content */}
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
