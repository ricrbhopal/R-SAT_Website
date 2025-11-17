import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import DemoAPI from "../config/api.js";

export default function DemoSlotBooking() {
  const [step, setStep] = useState(1); // 1 = collect contact, 2 = verify OTP, 3 = booked
  const [form, setForm] = useState({
    studentName: "",
    email: "",
    phone: "",
    collegeName: "",
    year: "",
    demoSolt: "",
    emailOTP: "",
    phoneOTP: "",
  });

  const [loading, setLoading] = useState(false);

  // Helper: update single field
  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  // Send OTPs to email & phone (step 1 -> step 2)
  const sendOTPs = async () => {
    if (!form.studentName || !form.email || !form.phone) {
      toast.error("Please fill name, email, and phone before requesting OTP.");
      return;
    }
    try {
      setLoading(true);
      await DemoAPI.bookDemoSlot({
        studentName: form.studentName,
        email: form.email,
        phone: form.phone,
      });
      toast.success(
        "OTPs sent to your Email and Phone. Enter them below to verify."
      );
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTPs");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTPs and book slot
  const bookSlot = async () => {
    // basic validation
    const required = [
      "studentName",
      "email",
      "phone",
      "collegeName",
      "year",
      "demoSolt",
      "emailOTP",
      "phoneOTP",
    ];
    for (const f of required) {
      if (!form[f]) {
        toast.error("Please fill all required fields before booking.");
        return;
      }
    }
    try {
      setLoading(true);
      await DemoAPI.bookDemoSlot(form);
      toast.success("🎉 Demo slot booked successfully!");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    await sendOTPs();
  };

  const resetForm = () => {
    setForm({
      studentName: "",
      email: "",
      phone: "",
      collegeName: "",
      year: "",
      demoSolt: "",
      emailOTP: "",
      phoneOTP: "",
    });
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8 mt-18 ">
      <div className="max-w-2xl mx-auto">
        {/* Main Form Card */}
        <div className="bg-gray-50 rounded-2xl mt-20 shadow-xl overflow-hidden">
          {/* Header Card */}
          <div className="  text p-5 rounded-2xl   ">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3 text-[#125785]">
                Book Your Demo Session
              </h1>
              
            </div>
          </div>
          {/* Progress Bar */}
          <div className="bg-gray-50 px-8 py-6 ">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold transition-all duration-300 ${
                      step >= stepNumber
                        ? "bg-[#125785] border-[#125785] text-white shadow-lg transform scale-110"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`w-36 h-1 mx-2 transition-all duration-500 ${
                        step > stepNumber ? "bg-[#125785]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-3 text-sm">
              <span
                className={`font-medium ${
                  step >= 1 ? "text-[#125785]" : "text-gray-400"
                }`}
              >
                Contact Info
              </span>
              <span
                className={`font-medium ${
                  step >= 2 ? "text-[#125785]" : "text-gray-400"
                }`}
              >
                Verify & Details
              </span>
              <span
                className={`font-medium ${
                  step >= 3 ? "text-[#125785]" : "text-gray-400"
                }`}
              >
                Confirmed
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Alerts */}
            {/* Step 1: Contact Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.studentName}
                      onChange={(e) => update("studentName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="your.email@example.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="10 digit mobile number"
                      type="tel"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={sendOTPs}
                      disabled={loading}
                      className="w-full bg-[#125785] text-white cursor-pointer py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-800 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
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
                          Sending OTPs...
                        </span>
                      ) : (
                        "Send Verification Codes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Verification & Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Almost There!
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Verify your identity and complete your booking
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Student Name
                    </label>
                    <input
                      value={form.studentName}
                      onChange={(e) => update("studentName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                      readOnly
                    />
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      College/University <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.collegeName}
                      onChange={(e) => update("collegeName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Your institution name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.year}
                      onChange={(e) => update("year", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select your year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Passed Out</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preferred Demo Slot{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.demoSolt}
                      onChange={(e) => update("demoSolt", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="e.g. 2025-12-01 11:00 AM"
                    />
                  </div>

                  {/* OTP Fields */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Verification Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.emailOTP}
                      onChange={(e) => update("emailOTP", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center font-mono text-lg"
                      placeholder="000000"
                      maxLength="6"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone Verification Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.phoneOTP}
                      onChange={(e) => update("phoneOTP", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center font-mono text-lg"
                      placeholder="000000"
                      maxLength="6"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={bookSlot}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                        Processing...
                      </span>
                    ) : (
                      "Verify & Confirm Booking"
                    )}
                  </button>

                  <button
                    onClick={resendOTP}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Resend Codes
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(1)}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors duration-200"
                  >
                    ← Back to Contact Info
                  </button>
                  <button
                    onClick={resetForm}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Booking Confirmed! 🎉
                </h2>

                <p className="text-gray-600 text-lg max-w-md mx-auto mb-2">
                  Your demo session has been successfully scheduled.
                </p>
                <p className="text-gray-500 mb-8">
                  Confirmation details have been sent to your email and phone.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto mb-8">
                  <h3 className="font-semibold text-blue-800 mb-3">
                    Booking Summary
                  </h3>
                  <div className="text-left space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{form.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Demo Slot:</span>
                      <span className="font-medium">{form.demoSolt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Institution:</span>
                      <span className="font-medium">{form.collegeName}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-800 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
                >
                  Book Another Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6   text-sm text-gray-500">
          Secure demo booking system • Your information is protected
        </div>
      </div>
    </div>
  );
}
