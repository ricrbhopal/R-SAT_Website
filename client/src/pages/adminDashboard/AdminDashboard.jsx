// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import Silder from "./Silder.jsx";
import DashboardHome from "./OverView.jsx";
import DashboardUsers from "./StudentRecordPage.jsx";
import DemoClass from "./DemoClassesPage.jsx";
import SupportManager from "./SupportManager.jsx";
import AccessControl from "./AdminRegister.jsx";
import RefferedPage from "./RefferedPage.jsx";
import AdmitCard from "./AdmitCardManagePage.jsx";
import ResultPage from "./ResultPage.jsx";

import { PiStudentFill } from "react-icons/pi";
import { MdOutlineSupportAgent } from "react-icons/md";
import { BsGraphUpArrow } from "react-icons/bs";
import { PiGiftBold } from "react-icons/pi";
import { SiGoogleclassroom } from "react-icons/si";
import { FaIdCardAlt } from "react-icons/fa";
import { GrAchievement } from "react-icons/gr";

import { AdminAPI } from "../../config/api"; // ensure path correct
import AdminLoginFinal from "../../pages/register&Login/AdminLogin.jsx"; // inline login component
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const navigate = useNavigate();

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
      node: <ResultPage />
    },
    {
      id: "admin-registration",
      title: "Admin Registration",
      icon: <PiStudentFill />,
      node: <AccessControl />,
    },
  ];

  useEffect(() => {
    // On mount, check for token in sessionStorage
    let mounted = true;
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      setIsAuthenticated(true);
      setAuthChecked(true);
      return;
    }
    // If no token, check profile (fallback for cookie-based auth)
    const checkAuth = async () => {
      try {
        await AdminAPI.getProfileAdmin();
        if (!mounted) return;
        setIsAuthenticated(true);
      } catch (err) {
        if (!mounted) return;
        setIsAuthenticated(false);
        setShowLoginModal(true);
      } finally {
        if (!mounted) return;
        setAuthChecked(true);
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // Called after inline login success (get data from AdminLoginFinal's onSuccess)
  const handleLoginSuccess = (data) => {
    // Save token to sessionStorage if available
    if (data?.token) {
      sessionStorage.setItem("admin_token", data.token);
    }
    setIsAuthenticated(true);
    setShowInlineLogin(false);
    setShowLoginModal(false);
    // optional: navigate to dashboard home
    // navigate("/admin/dashboard"); // if you want explicit navigation
  };

  if (!authChecked) {
    // still checking auth — show spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <svg className="animate-spin h-8 w-8 text-sky-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <p className="mt-3 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // not authenticated => show popup modal prompting login, but still render dashboard in background
    return (
<>
<div className="relative">
  <Silder items={items} initialId="home" />

  {/* Professional Overlay Modal */}
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm  overscroll-y-auto">
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Authentication Required</h3>
              <p className="text-blue-100 mt-1 text-sm">
                Secure access to admin dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLoginModal(false)}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 overflow-y-auto max-h-[60vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Access
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Choose your preferred authentication method
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowInlineLogin((s) => !s)}
                className={`w-full group relative overflow-hidden border-2 py-4 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 ${
                  showInlineLogin 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      showInlineLogin ? 'bg-blue-500' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-5 h-5 ${showInlineLogin ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${showInlineLogin ? 'text-blue-600' : 'text-gray-700 overscroll-y-auto'}`}>
                        {showInlineLogin ? "Close Inline Login" : "Quick Login Here"}
                      </div>
                      <div className="text-gray-500 text-xs">Login without leaving this page</div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => alert("If you don't have access, contact the system administrator.")}
                className="w-full group border border-gray-200 hover:border-gray-300 bg-white py-3 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-700">Request Access</div>
                    <div className="text-gray-500 text-xs">Contact system administrator</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column - Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security & Access Information
              </h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-green-800">Role-Based Access Control</div>
                  <p className="text-green-700 text-sm mt-1">Different access levels for Callers, Managers, and Admins</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Secure Authentication</div>
                  <p className="text-blue-700 text-sm mt-1">All actions are logged and attributed to your account</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-purple-800">Need Help?</div>
                  <p className="text-purple-700 text-sm mt-1">Contact an existing Admin to grant you the appropriate role and permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Login Section */}
        {showInlineLogin && (
          <div className="mt-8 pt-8 border-t border-gray-200 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold text-gray-800">Quick Sign In</h4>
                <p className="text-gray-600 text-sm mt-1">Enter your credentials below</p>
              </div>
              <AdminLoginFinal
                onSuccess={handleLoginSuccess}
                autoRedirect={false}
                compact={true}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
</div>

<style jsx>{`
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`}</style>
</>
    );
  }

  // authenticated — render dashboard as normal
  return (
    <div className="mt-20">
      <Silder items={items} initialId="home" />
    </div>
  );
}
