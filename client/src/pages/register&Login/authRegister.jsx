import React, { useState } from "react";
import { AuthAPI, setAuthToken } from "../../config/api";
import { useNavigate } from "react-router-dom";

const AuthRegister = () => {
  const [tab, setTab] = useState("register");

  // Register state
  const [form, setForm] = useState({
    fullName: "",
    mail_ID: "",
    phoneNo: "",
    college: "",
    branch: "",
    year: "",
    PaymentAddress: "",
    dob: "",
    phoneOTP: "",
  });
  const [sendingOtp, setSendingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Login state
  const [loginForm, setLoginForm] = useState({ student_ID: "", dob: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Dropdown options
  const streamOptions = [
    "Computer Science & Engineering",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Information Technology",
    "Artificial Intelligence",
    "Data Science",
    "Business Administration",
    "Commerce",
    "Science",
    "Arts",
    "Other",
  ];

  const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleLoginChange = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const onSendOTP = async () => {
    setError(null);
    setMessage(null);
    if (!form.fullName || !form.phoneNo) {
      setError("Full name and phone number are required to send OTP");
      return;
    }
    try {
      setSendingOtp(true);
      await AuthAPI.sendOTP({
        fullName: form.fullName,
        phoneNo: form.phoneNo,
      });
      setMessage("OTP sent to the provided phone number. Please check and enter it below.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to send OTP"
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const onRegister = async () => {
    setError(null);
    setMessage(null);
    const required = [
      "fullName",
      "phoneNo",
      "college",
      "branch",
      "year",
      "dob",
      "phoneOTP",
    ];
    for (const k of required)
      if (!form[k]) return setError("Please fill all required fields and OTP");

    try {
      setRegistering(true);
      const payload = {
        fullName: form.fullName,
        phoneNo: form.phoneNo,
        college: form.college,
        branch: form.branch,
        year: form.year,
        dob: form.dob.split("T")[0], // Extract only the date part
        phoneOTP: form.phoneOTP,
        email: form.mail_ID, // Include email in the payload
      };

      const res = await AuthAPI.register(payload);
      setMessage(res?.data?.message || "Registered successfully");
      setTab("login");
      // Clear registration form fields after success
      setForm({
        fullName: "",
        mail_ID: "",
        phoneNo: "",
        college: "",
        branch: "",
        year: "",
        PaymentAddress: "",
        dob: "",
        phoneOTP: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setRegistering(false);
    }
  };

  const onLogin = async () => {
    setError(null);
    setMessage(null);
    if (!loginForm.student_ID || !loginForm.dob)
      return setError("Student ID and DOB are required");
    try {
      setLoggingIn(true);
      const res = await AuthAPI.login(loginForm);
      const token = res?.data?.token;
      if (token) {
        // store token in sessionStorage for this session
        sessionStorage.setItem("token", token);
        setAuthToken(token);
        navigate("/candidate/dashboard");
      } else if (res?.status === 200) {
        // server may set httpOnly cookie instead of returning token in body
        // navigate on success so client can fetch profile using cookie-based auth
        navigate("/candidate/dashboard");
      }
      setMessage(res?.data?.message || "Login successful");
 
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 mt-12 sm:mt-15">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-[#125785] bg-clip-text text-transparent mb-4">
            R-SAT
          </h1>
          <p className="text-xl text-[#125785] font-light">
            Registration Portal
          </p>
          <div className="w-24 h-1 bg-[#125785] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 ">
          {/* Tab Header */}
          <div className="flex bg-linear-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50">
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-6 text-center font-semibold cursor-pointer text-lg transition-all duration-500 relative group ${
                tab === "register"
                  ? "text-[#125785] bg-white shadow-lg"
                  : "text-gray-600 hover:text-[#125785] hover:bg-white/70"
              }`}
            >
              <span className="relative z-10">Registeration</span>
              {tab === "register" && (
                <>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#125785]"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-white to-blue-50/30"></div>
                </>
              )}
            </button>
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-6 text-center font-semibold cursor-pointer text-lg transition-all duration-500 relative group ${
                tab === "login"
                  ? "text-[#125785] bg-white shadow-lg"
                  : "text-gray-600 hover:text-[#125785] hover:bg-white/70"
              }`}
            >
              <span className="relative z-10">Sign In</span>
              {tab === "login" && (
                <>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#125785]"></div>
                  <div className="absolute inset-0 bg-linear-to-r from-white to-blue-50/30"></div>
                </>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-10">
            {/* Messages */}
            {message && (
              <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-start space-x-3 shadow-md">
                <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-800 font-medium text-sm sm:text-base">{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 bg-linear-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-start space-x-3 shadow-md">
                <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-800 font-medium text-sm sm:text-base">{error}</span>
              </div>
            )}

            {/* Register Form */}
            {tab === "register" && (
              <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                {/* Personal Information */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-linear-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                      Personal Information
                    </h3>
                    <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm">Tell us about yourself</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                        />
                        <div
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                          onClick={(e) => {
                            const inp = e.currentTarget.parentElement.querySelector('input, select, textarea');
                            inp?.focus();
                          }}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                          Email *
                        </label>
                        <div className="relative">
                          <input
                            name="mail_ID"
                            type="email"
                            value={form.mail_ID}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                          />
                          <div
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onClick={(e) => {
                              const inp = e.currentTarget.parentElement.querySelector('input, select, textarea');
                              inp?.focus();
                            }}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <input
                            name="phoneNo"
                            value={form.phoneNo}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                            className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                          />
                          <div
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onClick={(e) => {
                              const inp = e.currentTarget.parentElement.querySelector('input, select, textarea');
                              inp?.focus();
                            }}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Address
                      </label>
                      <div className="relative">
                        <input
                          name="PaymentAddress"
                          value={form.PaymentAddress}
                          onChange={handleChange}
                          placeholder="Your complete address"
                          className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                        />
                        <div
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                          onClick={(e) => {
                            const inp = e.currentTarget.parentElement.querySelector('input, select, textarea');
                            inp?.focus();
                          }}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <input
                          name="dob"
                          type="date"
                          value={form.dob}
                          onChange={handleChange}
                          className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                        />
                        <div
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                          onClick={(e) => {
                            const inp = e.currentTarget.parentElement.querySelector('input, select, textarea');
                            inp?.focus();
                          }}
                        >
                    
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-linear-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                      Academic Information
                    </h3>
                    <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm">Your educational background</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        College Name *
                      </label>
                      <div className="relative">
                        <input
                          name="college"
                          value={form.college}
                          onChange={handleChange}
                          placeholder="Enter your college name"
                          className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                          Branch *
                        </label>
                        <div className="relative">
                          <select
                            name="branch"
                            value={form.branch}
                            onChange={handleChange}
                            className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md appearance-none cursor-pointer"
                          >
                            <option value="">Select your branch</option>
                            {streamOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                          Year *
                        </label>
                        <div className="relative">
                          <select
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md appearance-none cursor-pointer"
                          >
                            <option value="">Select year</option>
                            {yearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OTP Section */}
                <div className="border-t border-gray-200 pt-6 sm:pt-8 lg:pt-10">
                  <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-linear-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                      Verification
                    </h3>
                    <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-sm">Verify your phone number</p>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="text-center lg:text-left">
                      <p className="text-gray-600 text-xs sm:text-sm">
                        We'll send a verification code to your phone
                      </p>
                    </div>
                    <button
                      onClick={onSendOTP}
                      disabled={sendingOtp}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-[#125785] cursor-pointer text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 w-full lg:w-auto"
                    >
                      {sendingOtp && (
                        <svg
                          className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      <span className="font-semibold text-sm sm:text-base lg:text-lg">
                        {sendingOtp ? "Sending OTP..." : "Send Verification OTP"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Phone OTP *
                      </label>
                      <div className="relative">
                        <input
                          name="phoneOTP"
                          value={form.phoneOTP}
                          onChange={handleChange}
                          placeholder="Enter 6-digit OTP"
                          className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 text-center text-base sm:text-lg lg:text-xl font-mono tracking-widest placeholder-gray-400 shadow-sm hover:shadow-md"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onRegister}
                  disabled={registering}
                  className="w-full py-3 sm:py-4 lg:py-5 bg-[#125785] cursor-pointer text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-base sm:text-lg lg:text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2 sm:space-x-3 mt-6 sm:mt-8"
                >
                  {registering && (
                    <svg
                      className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  <span className="text-base sm:text-lg lg:text-xl">
                    {registering ? "Creating Your Account..." : "Create R-SAT Account"}
                  </span>
                </button>
              </div>
            )}

            {/* Login Form */}
            {tab === "login" && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                    Welcome Back!
                  </h2>
                  <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg">
                    Sign in to your R-SAT account
                  </p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Student ID *
                    </label>
                    <div className="relative">
                      <input
                        name="student_ID"
                        value={loginForm.student_ID}
                        onChange={handleLoginChange}
                        placeholder="e.g., RICR-RS-0001"
                        className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 placeholder-gray-400 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <input
                        name="dob"
                        type="date"
                        value={loginForm.dob}
                        onChange={handleLoginChange}
                        className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-lg sm:rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-white/50 text-sm sm:text-base lg:text-lg shadow-sm hover:shadow-md"
                      />
           
                    </div>
                  </div>

                  <button
                    onClick={onLogin}
                    disabled={loggingIn}
                    className="w-full py-3 sm:py-4 lg:py-5 bg-[#125785] cursor-pointer text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-base sm:text-lg lg:text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2 sm:space-x-3"
                  >
                    {loggingIn && (
                      <svg
                        className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span className="text-base sm:text-lg lg:text-xl">
                      {loggingIn ? "Signing In..." : "Sign In to R-SAT"}
                    </span>
                  </button>

                  <div className="text-center pt-6 sm:pt-8 border-t border-gray-200">
                    <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setTab("register")}
                        className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-300 hover:underline"
                      >
                        Create one here
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10 lg:mt-12 px-2">
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2026 R-SAT Registration Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthRegister;