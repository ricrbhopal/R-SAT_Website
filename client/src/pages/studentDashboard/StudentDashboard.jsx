// client/src/pages/candidateDashboard/CandidateDashboard.jsx
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
import Demo from "./BookDemoPage.jsx";
import Support from "./HelpCenterPage.jsx";
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

  // localStorage key for selected tab
  const STORAGE_KEY = "candidate_selected_action";

  // ----- Initialize selectedId from localStorage (persisted). Default to 1 (Profile).
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : null;
      if (parsed && [1, 2, 3, 4, 5, 6].includes(parsed)) return parsed;
    } catch (e) {
      // ignore localStorage errors
    }
    return 1;
  });

  // Persist selectedId -> localStorage (keeps selection after reload)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(selectedId));
    } catch (e) {
      // ignore
    }
  }, [selectedId]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await AuthAPI.getStudentProfile();
        const payload = response?.data;
        setProfile(payload?.student || payload || {});
      } catch (err) {
        if (err.response?.status === 400) {
          setError("Invalid request. Please check your account details.");
        } else {
          setError("Failed to fetch profile. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Redirect to login if no token
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Please login first to access the dashboard.");
      navigate("/RegistrationForm");
    }
  }, [navigate]);

  // ONE-TIME refresh after login:
  // If user has a token and we haven't refreshed the dashboard once in this session,
  // set a session flag and reload once. This avoids infinite reload loops.
  useEffect(() => {
    try {
      const token = sessionStorage.getItem("token");
      const refreshed = sessionStorage.getItem("dashboardRefreshed");
      if (token && refreshed !== "true") {
        // mark refreshed so we don't reload again in this session
        sessionStorage.setItem("dashboardRefreshed", "true");
        // full reload so all components mount fresh
        window.location.reload();
      }
    } catch (e) {
      // ignore storage errors
    }
    // empty deps so it runs once on mount
  }, []);

  // Ensure page always starts at the top after any reload / mount.
  // Some browsers attempt to restore scroll position after reload, so we force top.
  useEffect(() => {
    // immediate attempt
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      // ignore
    }
    // also ensure in next paint/frame
    requestAnimationFrame(() => {
      try {
        window.scrollTo(0, 0);
      } catch (e) {}
    });
  }, []);

  // quickActions declared inside component so we can reference it when initializing selection
  const quickActions = [
    {
      id: 1,
      title: "Profile",
      content: <Profile key="profile" />,
      icon: <FiUser className="w-5 h-5 text-blue-600" />,
      accent: "bg-blue-100",
    },
    {
      id: 2,
      title: "Admit Card",
      content: <AdmitCard key="admit" />,
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
          <Reffered key="referred" />
        </div>
      ),
      icon: <FiUsers className="w-5 h-5 text-pink-600" />,
      accent: "bg-pink-100",
    },
    {
      id: 5,
      title: "Book Demo Classes",
      content: <Demo key="demo" />,
      icon: <FiCalendar className="w-5 h-5 text-purple-600" />,
      accent: "bg-purple-100",
    },
    {
      id: 6,
      title: "Help Center",
      content: <Support key="support" />,
      icon: <FiMail className="w-5 h-5 text-yellow-600" />,
      accent: "bg-yellow-100",
    },
  ];

  // get the selected action object
  const selectedAction = quickActions.find((q) => q.id === selectedId) || quickActions[0];

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

  // Handler when clicking a quick action:
  // Save selection to localStorage (so after reload selected tab can be restored),
  // then perform a full window reload so the tab starts from initial state.
  const handleActionClick = (actionId) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(actionId));
    } catch (e) {
      // ignore storage errors
    }
    // ensure scroll top (best-effort) before reload
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
    // full reload; after reload selectedId will be restored from localStorage and components mount fresh
    window.location.reload();
  };

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
                onClick={() => handleActionClick(action.id)}
                aria-pressed={selectedId === action.id}
                className={`shrink-0 min-w-40 text-left p-4 cursor-pointer rounded-2xl border shadow-sm transition-transform duration-150 flex items-center gap-3
                    ${
                      selectedId === action.id
                        ? "bg-blue-50 border-blue-300 shadow"
                        : "bg-white border-gray-200 hover:shadow-md"
                    }`}
              >
                <div className={`p-2 rounded-lg ${action.accent}`}>{action.icon}</div>
                <div className="text-sm font-medium text-gray-900">{action.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col mt-6">
          <main className="flex-1">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex mb-4">
                <div className="text-sm text-gray-500">{selectedAction?.desc}</div>
              </div>

              <div className="mt-4">{selectedAction?.content}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
