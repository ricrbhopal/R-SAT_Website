// client/src/src/pages/callerDashboard/CallerDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Copy,
  Share2,
  RefreshCw,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CountUp from "react-countup";
import { ReferralAPI, CallerAPI } from "../../config/api.js";

/* ----------------- Utilities ----------------- */
function getStoredToken() {
  const possibleKeys = ["token", "accessToken", "authToken", "jwt"];
  for (const k of possibleKeys) {
    const v = sessionStorage.getItem(k);
    if (v) return v;
  }
  try {
    const userRaw = sessionStorage.getItem("user");
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      if (userObj?.token) return userObj.token;
      if (userObj?.accessToken) return userObj.accessToken;
    }
  } catch (e) {}
  return null;
}

function monthIndexFromIso(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d.getMonth();
  } catch {
    return null;
  }
}

function buildMonthlyFromReferred(referredArray) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  const counts = new Array(12).fill(0);
  referredArray.forEach((r) => {
    const dateStr = r?.referredDate || r?.createdAt || r?.referredDate;
    const idx = monthIndexFromIso(dateStr);
    if (idx !== null && idx >= 0 && idx < 12) counts[idx] += 1;
  });
  return months.map((m, i) => ({ month: m, registrations: counts[i] }));
}

/* ----------------- Component ----------------- */
export default function CallerReffered() {
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: "",
    _id: "",
    fullName: "",
    role: "caller",
    avatarColor: ""
  });
  const [monthlyData, setMonthlyData] = useState([
    { month: "Jan", registrations: 0 },
    { month: "Feb", registrations: 0 },
    { month: "Mar", registrations: 0 },
    { month: "Apr", registrations: 0 },
    { month: "May", registrations: 0 },
    { month: "Jun", registrations: 0 },
    { month: "Jul", registrations: 0 },
    { month: "Aug", registrations: 0 },
    { month: "Sep", registrations: 0 },
    { month: "Oct", registrations: 0 },
    { month: "Nov", registrations: 0 },
    { month: "Dec", registrations: 0 },
  ]);
  const [recentReferrals, setRecentReferrals] = useState([]);

  useEffect(() => {
    // Initialize user info with random avatar color
    try {
      const userRaw = sessionStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        const colors = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        setUserInfo({
          username: u.username || "",
          _id: u._id || "",
          fullName: u.fullName || u.username || "",
          role: u.role || "caller",
          avatarColor: randomColor
        });
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    let isMounted = true;
    
    async function fetchAll() {
      setLoading(true);
      try {
        if (CallerAPI && CallerAPI.listCallers) {
          const headers = {};
          if (token) headers.authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
          const res = await CallerAPI.listCallers({}, { headers });
          const items = res?.data?.data || res?.data || [];
          const referredOnly = items.map((it) => it?.referred).filter(Boolean);
          
          if (isMounted) {
            setRecentReferrals(referredOnly);
            const monthly = buildMonthlyFromReferred(referredOnly);
            setMonthlyData(monthly);
          }
        } else if (ReferralAPI && ReferralAPI.getRecentReferrals) {
          const headers = {};
          if (token) headers.authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
          const r = await ReferralAPI.getRecentReferrals({}, { headers });
          const data = r?.data || [];
          const referredOnly = data.filter(Boolean);
          
          if (isMounted) {
            setRecentReferrals(referredOnly);
            setMonthlyData(buildMonthlyFromReferred(referredOnly));
          }
        }

        // Get or create referral link
        try {
          if (ReferralAPI && ReferralAPI.createReferral) {
            const headers = {};
            if (token) headers.authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
            const linkResp = await ReferralAPI.createReferral({}, { headers });
            const linkData = linkResp?.data || {};
            const link =
              linkData?.referralLink ||
              (linkData?.ref && linkData.ref.referrerUserId
                ? `${window.location.origin}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(
                    linkData.ref.referrerUserId
                  )}`
                : "");
            if (isMounted && link) setReferralLink(link);
          }
        } catch (e) {
          console.log("Link creation skipped");
        }
      } catch (err) {
        console.error("fetchAll error:", err);
        toast.error("Failed to fetch data. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Totals for UI
  // totalRegistered = total referred records
  const totalRegistered = recentReferrals.length;

  // current month index and registrations for current month
  const currentMonthIndex = new Date().getMonth(); // 0..11
  const monthRegistrations = (monthlyData && monthlyData[currentMonthIndex] && Number(monthlyData[currentMonthIndex].registrations || 0)) || 0;

  // total registrations across months (sum)
  const totalAllMonths = monthlyData.reduce((s, m) => s + Number(m.registrations || 0), 0);

  // Avoid mismatch: prefer using actual counted totals (recentReferrals length) if that better represents "totalRegistered"
  // For chart we will use: [thisMonth, rest = totalRegistered - thisMonth] but fallback to totalAllMonths if recentReferrals is zero
  const basisTotal = totalRegistered || totalAllMonths || 0;
  const rest = Math.max(0, basisTotal - monthRegistrations);

  /* Actions */
  const handleCopy = async () => {
    if (!referralLink) return toast.error("No referral link available.");
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("🎉 Link copied to clipboard!");
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      toast.error("Failed to copy.");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return toast.error("No referral link available.");
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: "Join My Network", 
          text: "Register using my referral link for exclusive benefits!", 
          url: referralLink 
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    const token = getStoredToken();
    if (!ReferralAPI || !ReferralAPI.createReferral) {
      return toast.error("Referral API not available.");
    }
    setLoading(true);
    try {
      const headers = {};
      if (token) headers.authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      const res = await ReferralAPI.createReferral({}, { headers });
      const link = res?.data?.referralLink || "";
      if (link) {
        setReferralLink(link);
        toast.success("✨ Link regenerated successfully!");
      } else {
        toast.info("No new link generated.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to regenerate link.");
    } finally {
      setLoading(false);
    }
  };

  const userInitials = userInfo.fullName
    ? userInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "CC";

  return (
    <div className="h-[890px] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-6  
    ">
      <ToastContainer 
        position="top-right"
        theme="dark"
        toastClassName="bg-gray-800 text-gray-100 border border-gray-700"
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Caller Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Track your referrals and performance
            </p>
          </div>

    
        </div>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  {monthRegistrations > 0 ? 'Active' : '—'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                <CountUp end={totalRegistered} duration={2} />
              </div>
              <div className="text-sm text-gray-400">Total Referrals</div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-xs text-cyan-300">
                <TrendingUp className="w-3 h-3" />
                <span>Active this month: {monthRegistrations}</span>
              </div>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
                  Current
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                <CountUp end={monthRegistrations} duration={2} />
              </div>
              <div className="text-sm text-gray-400">Monthly Registrations</div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-xs text-purple-300">
                <TrendingUp className="w-3 h-3" />
                <span>Peak: {Math.max(...monthlyData.map(m => m.registrations))}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Referral Link */}
            <div className="lg:col-span-2 bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Your Referral Link</h2>
                  <p className="text-sm text-gray-400">Share this link to track referrals</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-sm transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Link Box */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gray-950/80 border border-gray-800 rounded-xl p-4">
                  {loading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-400">Generating your referral link...</span>
                    </div>
                  ) : referralLink ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Your unique link</div>
                        <div className="font-mono text-sm text-cyan-300 break-all bg-gray-900/50 rounded-lg p-3">
                          {referralLink}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No referral link available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Simple Stats Display */}
            <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Registration Stats</h3>
                <p className="text-sm text-gray-400">Monthly breakdown</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-950/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">This Month</div>
                  <div className="text-3xl font-bold text-cyan-400">{monthRegistrations}</div>
                </div>
                <div className="bg-gray-950/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Other Months</div>
                  <div className="text-3xl font-bold text-gray-400">{totalRegistered - monthRegistrations}</div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-400 mb-1">Total Registrations</div>
                  <div className="text-2xl font-bold text-white">{basisTotal}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 text-center text-sm text-gray-500">
          <p>Dashboard updates in real-time</p>
        </div>
      </div>
    </div>
  );
}
