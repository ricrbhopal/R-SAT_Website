// client/src/pages/callerDashboard/CallerDashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Link2,
  Share2,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Zap,
  Sparkles,
  Building2,
  PhoneCall,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CountUp from "react-countup";
import { ReferralAPI } from "../../config/api.js";

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

/* Heuristic: check if referral record looks like a completed registration via referral */
function looksLikeReferralRegistration(r) {
  if (!r || typeof r !== "object") return false;
  if (r.registeredWithReferral === true) return true;
  if (r.source && String(r.source).toLowerCase().includes("ref")) return true;
  if (r.referrer || r.ref || r.referredBy || r.referrerId) return true;
  // if status says successful/registered
  if (r.status && ["successful", "registered", "completed"].includes(String(r.status).toLowerCase())) return true;
  return false;
}

/* Aggregate monthly data into chart-friendly arrays */
function buildChartData(monthlyData) {
  // monthlyData expected: [{month: "Jan", registrations: 3}, ...]
  const labels = monthlyData.map((m) => m.month);
  const values = monthlyData.map((m) => Number(m.registrations || 0));
  return { labels, values };
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
  const [, setCurrentQuote] = useState("Share confidently — quality outreach converts.");

  const motivationQuotes = [
    "Share confidently — quality outreach converts.",
    "One clear message can change a student's future.",
    "Small, consistent efforts create lasting results.",
    "Be professional. Be helpful. Earn trust.",
  ];

  useEffect(() => {
    // seed user info & quote
    try {
      const userRaw = sessionStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        setUserInfo({
          username: u.username || "",
          _id: u._id || "",
          fullName: u.fullName || u.username || "",
          role: u.role || "caller",
        });
      }
    } catch (e) {}
    setCurrentQuote(motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]);
  }, []); // run once

  useEffect(() => {
    // fetch referral link, monthly stats, recent referrals
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return toast.error("Please login to view your dashboard.");
    }

    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      try {
        const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

        // 1) create/get referral link
        if (ReferralAPI && ReferralAPI.createReferral) {
          const linkResp = await ReferralAPI.createReferral({}, { headers: { authorization: authHeader } });
          const linkData = linkResp?.data || {};
          const link =
            linkData?.referralLink ||
            (linkData?.ref && linkData.ref.referrerUserId
              ? `${window.location.origin}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(
                  linkData.ref.referrerUserId
                )}`
              : "");
          if (isMounted && link) setReferralLink(link);

          // backend might return monthly/reg stats inside response
          if (linkData?.monthlyRegistrations) {
            if (isMounted) setMonthlyData(linkData.monthlyRegistrations);
          }
          if (linkData?.recentReferrals) {
            if (isMounted) setRecentReferrals(linkData.recentReferrals);
          }
        }

        // 2) try dedicated endpoints (if available)
        if (ReferralAPI.getMonthlyRegistrations) {
          try {
            const mRes = await ReferralAPI.getMonthlyRegistrations({}, { headers: { authorization: authHeader } });
            if (isMounted && mRes?.data) setMonthlyData(mRes.data);
          } catch (e) {
            // ignore — fallback kept
          }
        }

        if (ReferralAPI.getRecentReferrals) {
          try {
            const rRes = await ReferralAPI.getRecentReferrals({}, { headers: { authorization: authHeader } });
            if (isMounted && rRes?.data) setRecentReferrals(rRes.data);
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast.error("Failed to load dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // prepared values
  
  const registeredFromLink = recentReferrals.filter(looksLikeReferralRegistration);
  const totalRegistered = registeredFromLink.length;
  const converted = registeredFromLink.filter((r) => String((r.status || "").toLowerCase()) === "successful").length;
  const conversionRate = totalRegistered ? Math.round((converted / totalRegistered) * 100) : 0;



  /* Actions */
  const handleCopy = async () => {
    if (!referralLink) return toast.error("No referral link available.");
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      toast.error("Copy failed.");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return toast.error("No referral link available.");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join via referral", text: "Register here:", url: referralLink });
      } catch (e) {
        // user cancelled or failed — fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    const token = getStoredToken();
    if (!token) return toast.error("Please login to regenerate.");
    setLoading(true);
    try {
      const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      const res = await ReferralAPI.createReferral({}, { headers: { authorization: authHeader } });
      const data = res?.data || {};
      if (data?.referralLink) {
        setReferralLink(data.referralLink);
        toast.success("Referral link regenerated.");
      } else {
        toast.info("No new link returned by API.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to regenerate link.");
    } finally {
      setLoading(false);
    }
  };

  /* Minor animation variants */
  const fadeIn = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

  // Build simple dark chart settings (keeps same structure)
  const chart = buildChartData(monthlyData);
  const barData = {
    labels: chart.labels,
    datasets: [
      {
        label: "Registrations",
        data: chart.values,
        backgroundColor: "rgba(16,185,129,0.9)", // teal-green accent
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: "#9CA3AF" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: { color: "#9CA3AF", stepSize: Math.max(1, Math.ceil(Math.max(...chart.values) / 4 || 1)) },
      },
    },
  };

  return (
    <div className="h-[890px] bg-gray-900 text-gray-100 p-6  ">
      <ToastContainer position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 mt-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-700 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Caller Dashboard</h1>
              <p className="text-sm text-gray-400">Professional referral overview — shows only registrations made via your link</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Caller</div>
              <div className="font-medium text-white">{userInfo.fullName || userInfo.username || "You"}</div>
              <div className="text-xs text-gray-400">ID: {userInfo._id ? userInfo._id.substring(0, 8) : "—"}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-2 shadow">
              <PhoneCall className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* main */}
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
          {/* top: link + stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* link card */}
            <motion.div variants={fadeIn} className="lg:col-span-2 bg-gray-800 rounded-2xl p-5 shadow border border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Your referral link</h2>
                  <p className="text-sm text-gray-400 mt-1">Share this with students — registrations via this link will be tracked here.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleRegenerate} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-700/80 text-sm text-gray-200">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                  </button>
                  <button onClick={handleShare} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-sm">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-sm break-words">
                {loading ? (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /> Preparing link...
                  </div>
                ) : referralLink ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-sm text-cyan-300 break-all">{referralLink}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCopy} className="px-3 py-1 rounded-md bg-gray-800 text-cyan-300 text-sm flex items-center gap-2">
                        <Copy className="w-4 h-4" /> {copied ? "Copied" : "Copy"}
                      </button>
                      <button onClick={() => (window.location.href = `sms:?body=${encodeURIComponent(`Register here: ${referralLink}`)}`)} className="px-3 py-1 rounded-md bg-gray-800 text-purple-300 text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> SMS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No referral link available</div>
                )}
              </div>

              {/* small tips */}
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>Tip: Add a short personal note when sharing — it increases trust and conversions.</div>
              </div>
            </motion.div>

            {/* stats small column */}
            <motion.aside variants={fadeIn} className="bg-gray-800 rounded-2xl p-4 shadow border border-gray-700 flex flex-col gap-4">
              <div>
                <h3 className="text-sm text-gray-400">This month</h3>
                <div className="mt-1 text-2xl font-semibold text-white">
                  <CountUp end={monthlyData.reduce((s, m) => s + Number(m.registrations || 0), 0)} duration={1.2} />
                </div>
                <div className="text-xs text-gray-400">Total registrations (monthly)</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-900 rounded-md text-center border border-gray-700">
                  <div className="text-sm text-gray-400">Registered</div>
                  <div className="text-lg font-medium text-white">{totalRegistered}</div>
                </div>
                <div className="p-3 bg-gray-900 rounded-md text-center border border-gray-700">
                  <div className="text-sm text-gray-400">Conversion</div>
                  <div className="text-lg font-medium text-white">{conversionRate}%</div>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">Only students who completed registration via your link are counted.</div>
            </motion.aside>
          </div>



          {/* recent registered referrals table */}
          <motion.div variants={fadeIn} className="bg-gray-800 rounded-2xl p-4 shadow border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-md font-semibold text-white">Recent registered referrals</h4>
                <p className="text-sm text-gray-400">Only registrations that originated from your referral link</p>
              </div>
              <div className="text-sm text-gray-400">{registeredFromLink.length} total</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Contact</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredFromLink && registeredFromLink.length ? (
                    registeredFromLink.slice(0, 10).map((r, i) => (
                      <tr key={r._id || i} className="border-b last:border-b-0 hover:bg-gray-700/40">
                        <td className="py-3 px-3 font-medium text-white">{r.fullName || r.name || r.mail_ID || "—"}</td>
                        <td className="py-3 px-3 text-gray-300">{r.phoneNo || r.mail_ID || r.email || "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${ (r.status || "").toLowerCase() === "successful" ? "bg-green-100 text-green-800" : (r.status || "").toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800" }`}>
                            {r.status || "registered"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">No registrations yet via your referral link.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
