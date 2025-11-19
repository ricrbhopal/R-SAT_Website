import React, { useState } from "react";
import { ReferralAPI } from "../../config/api.js";
import { Copy, Link2, Users, Share2, CheckCircle2 } from "lucide-react";
import ScholarshipImage from "../../assets/scholarshipp.png";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const cleaned = token.trim().startsWith("Bearer ")
    ? token.trim().slice(7)
    : token.trim();
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
    console.error("Failed to decode JWT payload:", e);
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

const ReferredPage = () => {
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createReferral = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        alert("You are not logged in. Please log in to generate a referral link.");
        return;
      }
      const payload = decodeJwtPayload(token);
      if (!payload) {
        alert("Invalid token. Please log in again.");
        return;
      }
      const studentId =
        payload.studentId ||
        payload.student_id ||
        payload.id ||
        payload.userId ||
        payload.user_id ||
        payload.sub;
      if (!studentId) {
        alert("Student ID not found in token. Please log in again.");
        return;
      }
      const response = await ReferralAPI.createReferral();
      const { code } = response.data;
      const origin = window.location.origin;
      setReferralLink(
        `${origin}/candidateDashboard/RefferedRegisterationPage?ref=${encodeURIComponent(
          code
        )}&studentId=${encodeURIComponent(studentId)}`
      );
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create referral link.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      if (!referralLink) return;
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on this platform!",
          text: "Check out this amazing platform I'm using. Join with my referral link!",
          url: referralLink,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className=" bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Copy toast */}
      {copied && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-5 py-2 rounded-full shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Link copied to clipboard!</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* responsive grid: stacked on mobile, two columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main (left) - spans 2 cols on desktop */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Share your referral link with friends and help them join our platform. Earn rewards when they sign up using your link.
                </p>
              </div>

              <div className="mt-4">
                <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex-1">Your Referral Link</h2>
                  <Link2 className="w-5 h-5 text-gray-400" />
                </div>

                {!referralLink ? (
                  <div className="flex flex-col sm:flex-col  gap-3">
                    <button
                      onClick={createReferral}
                      disabled={loading}
                      className="w-full sm:w-auto bg-blue-200 hover:bg-blue-300 disabled:bg-blue-300  hover:text-white  cursor-pointer text-blue-600  py-3 px-4 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Link...</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-5 h-5" />
                          <span>Generate Referral Link</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 pr-20 break-words text-sm text-gray-600 font-mono">
                        {referralLink}
                      </div>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={copyLink}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-700 py-2 px-4 rounded-xl py-4 transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={shareLink}
                        className="flex-1 bg-green-100 hover:bg-green-200 hover:text-blue-700 cursor-pointer text-green-600 py-4 px-4 rounded-xl transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right column (benefits) */}
          <aside>
            <div className="bg-white rounded-2xl shadow p-6 h-full flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Referral Benefits</h3>

              <div className="w-full max-w-[220px]">
                <img
                  src={ScholarshipImage}
                  alt="Scholarship"
                  className="w-full h-auto max-h-44 object-contain mx-auto mb-4"
                />
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
                <button
                  onClick={() => window.open("/refer-rules", "_blank")}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 py-2 px-3 rounded-lg text-sm"
                >
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

export default ReferredPage;
