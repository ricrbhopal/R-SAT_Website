// src/components/admin/AdminRegisterProfessionalFinal_v2.jsx
import React, { useState, useEffect, useRef } from "react";
import { AdminAPI } from "../../config/api";

/**
 * Company-ready, simplified & user-friendly Admin registration UI with OTP.
 * - Top progress bar, single column form
 * - Accessible, keyboard-friendly OTP inputs
 * - Minimal microcopy and clear CTA
 * - Tailwind CSS required
 */

const OTP_LEN = 6;
const COOLDOWN = 60;

export default function AdminRegisterProfessionalFinal_v2() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otpArr, setOtpArr] = useState(Array(OTP_LEN).fill(""));
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("caller");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'error'|'success', text }
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const show = (type, text) => setNotice({ type, text });
  const clear = () => setNotice(null);
  const resetAll = () => {
    setStep(1); setPhone(""); setOtpArr(Array(OTP_LEN).fill("")); setName(""); setPassword(""); setRole("caller"); setTimer(0); clear();
  };

  const validPhone = (p) => /^\d{10,15}$/.test(String(p).trim());

  // SEND OTP
  const sendOtp = async () => {
    clear();
    if (!validPhone(phone)) return show("error", "Valid phone required (10–15 digits)");
    try {
      setLoading(true);
      await AdminAPI.sendAdminOtp({ phone: phone.trim() });
      show("success", "OTP sent. Check SMS.");
      setStep(2);
      setTimer(COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus?.(), 200);
    } catch (e) {
      show("error", e?.response?.data?.message || e?.message || "Unable to send OTP");
    } finally { setLoading(false); }
  };

  // OTP helpers
  const otpValue = otpArr.join("");
  const onOtpChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otpArr]; next[i] = v.slice(-1); setOtpArr(next);
    if (v && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };
  const onOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otpArr[i] && i > 0) { otpRefs.current[i-1]?.focus(); }
    if (e.key === "Enter") verifyOtp();
    if (e.key === "ArrowLeft" && i>0) otpRefs.current[i-1]?.focus();
    if (e.key === "ArrowRight" && i<OTP_LEN-1) otpRefs.current[i+1]?.focus();
  };

  // VERIFY OTP
  const verifyOtp = async () => {
    clear();
    if (!validPhone(phone)) return show("error", "Invalid phone");
    if (otpValue.length !== OTP_LEN) return show("error", "Enter full OTP");
    try {
      setLoading(true);
      await AdminAPI.verifyAdminOtp({ phone: phone.trim(), otp: otpValue });
      show("success", "OTP verified. Complete details below.");
      setStep(3);
      setTimeout(() => document.getElementById("name")?.focus?.(), 150);
    } catch (e) {
      show("error", e?.response?.data?.message || e?.message || "OTP invalid");
    } finally { setLoading(false); }
  };

  // RESEND
  const resend = () => { if (timer>0) return; sendOtp(); };

  // REGISTER
  const register = async (ev) => {
    ev.preventDefault();
    clear();
    if (!name.trim()) {
      return show("error", "Full name is required");
    }
    if (!validPhone(phone)) {
      return show("error", "Invalid phone number. Must be 10–15 digits.");
    }
    if (!password || password.length < 6) {
      return show("error", "Password must be at least 6 characters long.");
    }
    try {
      setLoading(true);
      const payload = {
        username: name.trim(),
        phone: phone.trim(),
        password,
        role,
      };
      console.log("Payload being sent:", payload); // Debugging
      const resp = await AdminAPI.registerAdmin(payload);
      show("success", resp?.data?.message || "User registered successfully.");
      setStep(4);
    } catch (e) {
      show("error", e?.response?.data?.message || e?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  // Top progress bar UI
  const Progress = () => {
    const steps = ["Phone", "Verify", "Details", "Done"];
    return (
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {steps.map((s, idx) => {
            const n = idx + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${done ? "bg-green-500 text-white" : active ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {done ? "✓" : n}
                </div>
                <div className={`text-xs ${active || done ? "text-gray-800" : "text-gray-400"}`}>{s}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded overflow-hidden">
          <div style={{ width: `${((step-1)/(steps.length-1))*100}%` }} className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all" />
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="shadow-sm rounded-2xl  py-10   ">
<h1 className="text-blue-800 ml-10 font-semibold text-xl">Admin-controlled Caller & Manager Access</h1>
    </div>
    
    <div className="max-w-2xl mx-auto my-8 bg-white border border-gray-100 rounded-xl shadow-md p-6 mt-20 mb-90">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Create User — Admin Panel</h1>
        <div className="text-sm text-gray-500">Secure • Phone verified</div>
      </div>

      <Progress />

      {notice && (
        <div className={`mb-4 rounded-md p-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
          {notice.text}
        </div>
      )}

      <div className="space-y-6">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
            <div className="flex gap-3">
              <div className="inline-flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-700">+91</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
                inputMode="numeric"
                aria-label="Phone number"
              />
              <button onClick={sendOtp} disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-60">
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">We’ll send a 6-digit code. Wait {COOLDOWN}s cooldown between attempts.</p>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
            <div className="flex gap-2 mb-3">
              {otpArr.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  value={v}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKey(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 text-center rounded-md border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={verifyOtp} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60">
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button onClick={resend} disabled={timer > 0} className="px-3 py-2 border rounded-md text-sm">
                {timer > 0 ? `Resend in ${timer}s` : "Resend"}
              </button>
              <button onClick={() => setStep(1)} className="text-sm text-gray-600 hover:underline">Change number</button>
            </div>

            <div className="mt-2 text-xs text-gray-500">Sent to: <span className="font-medium text-gray-700">{phone}</span></div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Verified phone</label>
              <input value={phone} readOnly className="w-full rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200" required minLength={6} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200">
                <option value="caller">Caller</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 border rounded-md">Back</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-60">
                {loading ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">User created</h3>
            <p className="text-sm text-gray-500 mt-1">They can now sign in with phone & password.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={resetAll} className="px-4 py-2 bg-sky-600 text-white rounded-md">Create another</button>
              <button onClick={resetAll} className="px-4 py-2 border rounded-md">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
