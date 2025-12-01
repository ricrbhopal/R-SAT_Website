// client/src/pages/candidateDashboard/RefferedPage.jsx
import React, { useState, useEffect } from "react";
import { ReferralAPI } from "../../config/api.js";
import { Copy, Link2, Users, Share2, CheckCircle2 } from "lucide-react";
import ScholarshipImage from "../../assets/scholarshipp.png";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const cleaned = token.trim().startsWith("Bearer ") ? token.trim().slice(7) : token.trim();
  const parts = cleaned.split(".");
  if (parts.length < 2) return null;
  const payloadB64 = parts[1];
  const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

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

const RefferedPage = () => {
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [refRecord, setRefRecord] = useState(null);

  useEffect(() => {
    const token = getStoredToken();
    const payload = decodeJwtPayload(token);
    setTokenPayload(payload);

    const ensureLink = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        const resp = await ReferralAPI.createReferral({}, { headers: { authorization: authHeader } });
        const data = resp?.data || {};
        const link =
          data?.referralLink ||
          (data?.ref && data.ref.referrerUserId
            ? `${window.location.origin}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(data.ref.referrerUserId)}`
            : "");
        if (link) setReferralLink(link);
        if (data?.ref) setRefRecord(data.ref);
      } catch (err) {
        console.error("ensureLink error:", err);
        setNotice({ type: "error", message: err?.response?.data?.message || "Could not fetch/generate referral link." });
      } finally {
        setLoading(false);
      }
    };

    ensureLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setNotice({ type: "success", message: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        const input = document.createElement("input");
        input.value = referralLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        setNotice({ type: "success", message: "Link copied to clipboard!" });
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        setNotice({ type: "error", message: "Failed to copy link." });
      }
    }
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join via my referral", text: "Register with this link", url: referralLink });
      } catch (e) {
        setNotice({ type: "error", message: "Share failed or cancelled." });
      }
    } else {
      copyLink();
    }
  };

  const regenerate = async () => {
    const token = getStoredToken();
    if (!token) {
      setNotice({ type: "error", message: "Please login to regenerate." });
      return;
    }
    setLoading(true);
    try {
      const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      const resp = await ReferralAPI.createReferral({}, { headers: { authorization: authHeader } });
      const data = resp?.data || {};
      const link =
        data?.referralLink ||
        (data?.ref && data.ref.referrerUserId ? `${window.location.origin}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(data.ref.referrerUserId)}` : "");
      if (link) setReferralLink(link);
      if (data?.ref) setRefRecord(data.ref);
      setNotice({ type: "success", message: "Referral link is ready." });
    } catch (err) {
      setNotice({ type: "error", message: "Could not regenerate link." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      {notice && (
        <div className={`max-w-6xl mx-auto mb-6 rounded-lg p-3 text-sm font-medium ${notice.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {notice.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">Share your referral link</h2>
                  <p className="text-gray-600 mt-1 truncate">Invite friends — they can register using this single link.</p>
                </div>

                <div className="ml-2 text-right">
                  <div className="text-xs text-gray-500">Logged in as</div>
                  <div className="text-sm font-medium text-gray-900">{tokenPayload?.fullName || tokenPayload?.name || tokenPayload?.email || "Candidate"}</div>
                  <div className="text-xs text-gray-500">{refRecord?.referrerStudentID || tokenPayload?.student_ID || ""}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Your Referral Link</h3>
                  <Link2 className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 break-words text-sm text-gray-700 font-mono min-h-[56px] flex items-center">
                      {loading ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> Preparing your link...
                        </div>
                      ) : referralLink ? (
                        <span className="break-all">{referralLink}</span>
                      ) : (
                        <span className="text-gray-400">No referral link available. Login and try again.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={copyLink} disabled={!referralLink} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                      {copied ? (<><CheckCircle2 className="w-4 h-4 text-green-600" /><span>Copied</span></>) : (<><Copy className="w-4 h-4" /><span>Copy</span></>)}
                    </button>

                    <button onClick={shareLink} disabled={!referralLink} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" /><span>Share</span>
                    </button>

                    <button onClick={regenerate} disabled={loading} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-xl transition-colors font-medium">
                      {loading ? "Working..." : "Refresh/Regenerate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside>
            <div className="bg-white rounded-2xl shadow p-6 h-full flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Referral Benefits</h3>

              <div className="w-full max-w-[220px]">
                <img src={ScholarshipImage} alt="Scholarship" className="w-full h-auto max-h-44 object-contain mx-auto mb-4" />
              </div>

              <div className="w-full space-y-3 mt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Help your friends discover our platform</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Easy one-click sharing</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Track your referrals</p>
                </div>
              </div>

              <div className="mt-6 w-full">
                <button onClick={() => window.open("/refer-rules", "_blank")} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 py-2 px-3 rounded-lg text-sm">
                  View Terms & Conditions
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RefferedPage;
