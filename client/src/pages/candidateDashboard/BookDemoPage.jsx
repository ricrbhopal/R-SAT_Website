import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { DemoAPI } from "../../config/api.js";

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
      await DemoAPI.sendDemoOTP({
        studentName: form.studentName,
        email: form.email,
        phone: form.phone,
      });
      toast.success(
        "OTPs sent to your Email and Phone. Enter them below to verify."
      );
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTPs");
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
      toast.error(err?.response?.data?.message || "Booking failed");
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
    <div className=" bg-gradient-to-br py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Form Card */}
        <div className="rounded-2xl mt-12 overflow-hidden">
          {/* Header Card */}
          <div className="text-center p-6 sm:p-8 rounded-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#125785]">
              Book Your Demo Session
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Choose a convenient slot — fast and secure</p>
          </div>

          {/* Progress Bar */}
          <div className="px-4 sm:px-8 py-4">
            <div className="hidden sm:flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold transition-all duration-300 ${
                      step >= stepNumber
                        ? "bg-[#125785] border-[#125785] text-white shadow-lg scale-110"
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

            {/* Mobile compact stepper */}
            <div className="sm:hidden flex items-center justify-between px-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= s ? "bg-[#125785] text-white" : "bg-white text-gray-400 border border-gray-200"}`}>
                    {s}
                  </div>
                  <div className={`text-xs mt-1 ${step >= s ? "text-[#125785]" : "text-gray-400"}`}>{s === 1 ? "Contact" : s === 2 ? "Verify" : "Done"}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between max-w-md mx-auto mt-3 text-sm hidden sm:flex">
              <span className={`font-medium ${step >= 1 ? "text-[#125785]" : "text-gray-400"}`}>Contact Info</span>
              <span className={`font-medium ${step >= 2 ? "text-[#125785]" : "text-gray-400"}`}>Verify & Details</span>
              <span className={`font-medium ${step >= 3 ? "text-[#125785]" : "text-gray-400"}`}>Confirmed</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Student Name <span className="text-red-500">*</span></label>
                    <input value={form.studentName} onChange={(e) => update("studentName", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                    <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="your.email@example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} type="tel" className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="10 digit mobile number" />
                  </div>

                  <div className="flex items-end">
                    <button onClick={sendOTPs} disabled={loading} className="w-full bg-[#125785] text-white py-3 px-6 rounded-xl font-semibold hover:opacity-95 transition">
                      {loading ? "Sending..." : "Send Verification Codes"}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500">By requesting codes you agree to receive SMS and Email for verification purposes.</p>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Almost There!</h2>
                  <p className="text-sm text-gray-500">Verify your identity and complete your booking</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Name</label>
                    <input value={form.studentName} readOnly className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input value={form.email} readOnly className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input value={form.phone} readOnly className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">College/University <span className="text-red-500">*</span></label>
                    <input value={form.collegeName} onChange={(e) => update("collegeName", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Your institution name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year <span className="text-red-500">*</span></label>
                    <select value={form.year} onChange={(e) => update("year", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                      <option value="">Select your year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Passed Out</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preferred Demo Slot <span className="text-red-500">*</span></label>
                    <select value={form.demoSolt} onChange={(e) => update("demoSolt", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                      <option value="">Select a preferred slot</option>
                      <option value="2025-11-17 11:00 AM">17-11-2025 11:00 AM</option>
                      <option value="2025-11-18 02:00 PM">18-11-2025 02:00 PM</option>
                      <option value="2025-11-19 11:00 AM">19-11-2025 11:00 AM</option>
                      <option value="2025-11-20 02:00 PM">20-11-2025 02:00 PM</option>
                      <option value="2025-11-21 11:00 AM">21-11-2025 11:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verification Code <span className="text-red-500">*</span></label>
                    <input value={form.emailOTP} onChange={(e) => update("emailOTP", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl text-center font-mono text-lg" placeholder="000000" maxLength={6} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Verification Code <span className="text-red-500">*</span></label>
                    <input value={form.phoneOTP} onChange={(e) => update("phoneOTP", e.target.value)} className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl text-center font-mono text-lg" placeholder="000000" maxLength={6} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button onClick={bookSlot} disabled={loading} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:opacity-95 transition">
                    {loading ? "Processing..." : "Verify & Confirm Booking"}
                  </button>
                  <button onClick={resendOTP} disabled={loading} className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:border-blue-500 transition">
                    Resend Codes
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <button onClick={() => setStep(1)} className="text-blue-600 hover:underline">← Back to Contact Info</button>
                  <button onClick={resetForm} className="text-red-600 hover:underline">Start Over</button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Booking Confirmed! 🎉</h2>
                <p className="text-gray-600 mb-4">Your demo session has been successfully scheduled. Confirmation details have been sent to your email and phone.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto mb-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Name:</span>
                    <span className="font-medium">{form.studentName}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600 text-sm">Demo Slot:</span>
                    <span className="font-medium">{form.demoSolt}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600 text-sm">Institution:</span>
                    <span className="font-medium">{form.collegeName}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={resetForm} className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 px-4 rounded-xl font-semibold">Book Another Session</button>
                  <button onClick={() => window.location.reload()} className="mt-2 sm:mt-0 text-gray-700">Go to Dashboard</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-500">Secure demo booking system • Your information is protected</div>
      </div>
    </div>
  );
}
