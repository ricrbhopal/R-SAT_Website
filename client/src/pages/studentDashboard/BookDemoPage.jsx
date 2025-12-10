// src/components/DemoSlotBooking.jsx
import React, { useEffect, useState } from "react";
import { AuthAPI } from "../../config/api.js"; // uses your AuthAPI as provided
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DemoSlotBooking() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [slots, setSlots] = useState([]);
  const [bookingInfo, setBookingInfo] = useState(null); // <-- store backend booking here

  const [form, setForm] = useState({
    studentName: "",
    email: "",
    phone: "",
    collegeName: "",
    year: "",
    demoSlot: "",
    type: "", // "online" | "offline"
  });

  useEffect(() => {
    // fetch profile and available slots in parallel
    const fetchAll = async () => {
      try {
        const [profRes, slotsRes] = await Promise.allSettled([
          AuthAPI.getStudentProfile(),
          AuthAPI.GetDemoSlots(),
        ]);

        if (profRes.status === "fulfilled") {
          const profile = profRes.value?.data?.student || profRes.value?.data || {};
          setForm((prev) => ({
            ...prev,
            studentName: profile.fullName || "",
            collegeName: profile.college || "",
            phone: profile.phoneNo || profile.phone || "",
            email: profile.mail_ID || profile.email || "",
            year: profile.year || "",
          }));
        }

        if (slotsRes.status === "fulfilled") {
          // Expecting array of objects with { id, slotTime, capacity, booked }
          const raw = slotsRes.value?.data || [];
          const normalized = raw.map((s) => {
            // Handle both string and object formats
            if (typeof s === "string") {
              return { value: s, label: s };
            }
            // For demo slot objects: use slotTime as display
            const value = s.id || s.value || s.slotTime || JSON.stringify(s);
            const label = s.slotTime || s.slot || s.value || s.label || JSON.stringify(s);
            return { value, label };
          });
          setSlots(normalized);
        }
      } catch (err) {
        console.error("fetchAll error:", err);
      }
    };

    fetchAll();
  }, []);

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const validateForm = () => {
    if (!form.demoSlot || form.demoSlot.trim() === "") {
      toast.error("❌ Please select Preferred Demo Slot.");
      return false;
    }
    if (!form.type || form.type.trim() === "") {
      toast.error("❌ Please select Demo Type.");
      return false;
    }

    // Check other required fields
    const required = ["studentName", "email", "phone", "collegeName", "year"];
    for (const f of required) {
      if (!form[f] || (typeof form[f] === "string" && form[f].trim() === "")) {
        toast.error(`❌ Please fill all required fields.`);
        return false;
      }
    }
    return true;
  };

  const bookSlot = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await AuthAPI.BookDemoSlot(form); // using your provided API

      // Backend may return alreadyBooked or 409/dedup response
      const resData = res?.data || {};

      if (resData.alreadyBooked) {
        setHasExistingBooking(true);
        setBookingInfo(resData.booking ?? null); // store booking from backend
        toast.info("ℹ️ You have already booked a demo slot.");
        setStep(2);
        return;
      }

      // success path (201 created)
      toast.success("✅ Demo slot booked successfully!");
      setHasExistingBooking(false);
      setBookingInfo(resData.booking ?? null); // store newly created booking
      setStep(2);
    } catch (err) {
      console.error("bookSlot error:", err);
      const serverData = err?.response?.data;

      // Handle duplicate booking / already booked (409)
      if (err?.response?.status === 409 && serverData?.alreadyBooked) {
        setHasExistingBooking(true);
        setBookingInfo(serverData.booking ?? null);
        toast.info("ℹ️ You have already booked a demo slot.");
        setStep(2);
        return;
      }

      // Mongo duplicate key style (if backend still returns code 11000)
      if (serverData?.code === 11000 || err?.code === 11000) {
        setHasExistingBooking(true);
        // sometimes the backend may include booking in the error payload
        setBookingInfo(serverData.booking ?? null);
        toast.info("ℹ️ You have already booked a demo slot. Please contact admin if you want to change.");
        setStep(2);
        return;
      }

      // Generic message from backend
      if (serverData?.message) {
        toast.error(`❌ ${serverData.message}`);
      } else {
        toast.error("❌ Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm((prev) => ({ ...prev, demoSlot: "", type: "" }));
    setStep(1);
    setHasExistingBooking(false);
    setBookingInfo(null); // clear booking info when user wants to book again
  };

  // Helper to show value either from bookingInfo (if available) else from form
  const display = (key) => bookingInfo?.[key] ?? form[key] ?? "";

  return (
    <div className="bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl mt-8 overflow-hidden shadow-sm border">
          <div className="text-center p-6 sm:p-8 bg-gradient-to-r from-white to-gray-50">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#125785]">
              Book Your Demo Session
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Choose a convenient slot — fast and secure
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* STEP 1 - Form */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.studentName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.email}
                      readOnly
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.phone}
                      readOnly
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      placeholder="10 digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College/University <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.collegeName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      placeholder="Your institution name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.year}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                      placeholder="Academic Year"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Demo Slot <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.demoSlot}
                      onChange={(e) => update("demoSlot", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a preferred slot</option>
                      {slots.length === 0 && (
                        <>
                          <option value="2025-11-17 11:00 AM">17-11-2025 11:00 AM</option>
                          <option value="2025-11-18 02:00 PM">18-11-2025 02:00 PM</option>
                          <option value="2025-11-19 11:00 AM">19-11-2025 11:00 AM</option>
                          <option value="2025-11-20 02:00 PM">20-11-2025 02:00 PM</option>
                          <option value="2025-11-21 11:00 AM">21-11-2025 11:00 AM</option>
                        </>
                      )}
                      {slots.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Demo Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => update("type", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Demo Type</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={bookSlot}
                    disabled={loading}
                    className="flex-1 bg-blue-200 text-blue-600 cursor-pointer py-3 px-4 rounded-xl font-semibold hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Book Demo Session"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 - Confirmation */}
            {step === 2 && (
              <div className="text-center py-6 sm:py-8">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    hasExistingBooking ? "bg-blue-100" : "bg-green-100"
                  }`}
                >
                  {hasExistingBooking ? (
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3">
                  {hasExistingBooking ? "Already Booked! ℹ️" : "Booking Confirmed! 🎉"}
                </h2>

                <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                  {hasExistingBooking
                    ? "You have already booked a demo slot. Contact admin if you need to make changes."
                    : "Your demo session has been scheduled. Confirmation details have been sent to your email and phone."}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 max-w-md mx-auto mb-6 text-left">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("studentName")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Demo Slot:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("demoSlot")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Institution:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("collegeName")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Phone:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("phone")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Email:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("email")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Year:</span>
                    </div>
                    <div>
                      <span className="font-medium">{display("year")}</span>
                    </div>

                    <div>
                      <span className="text-gray-600">Type:</span>
                    </div>
                    <div>
                      <span className="font-medium capitalize">{(bookingInfo?.type ?? form.type) || ""}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!hasExistingBooking && (
                    <button
                      onClick={resetForm}
                      className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 px-6 rounded-xl font-semibold hover:opacity-90 transition"
                    >
                      Book Another Session
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="border border-gray-300 text-gray-700 py-2 px-6 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          Secure demo booking system • Your information is protected
        </div>
      </div>
    </div>
  );
}
