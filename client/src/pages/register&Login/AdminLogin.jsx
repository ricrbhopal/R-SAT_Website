// src/components/admin/AdminLoginFinal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAPI } from "../../config/api";



export default function AdminLoginFinal({ onSuccess, autoRedirect = true }) {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'error'|'success', text }

  const clearNotice = () => setNotice(null);
  const showError = (txt) => setNotice({ type: "error", text: txt });
  const showSuccess = (txt) => setNotice({ type: "success", text: txt });

  const validate = () => {
    if (!phone || !/^\d{10,15}$/.test(phone.trim())) return "Please enter a valid phone (10–15 digits).";
    if (!password) return "Password is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearNotice();
    const v = validate();
    if (v) return showError(v);

    try {
      setLoading(true);
      const resp = await AdminAPI.loginAdmin({ phone: phone.trim(), password });
      const data = resp?.data || {};
      showSuccess(data?.message || "Login successful");

      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        const role = data.user.role;
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "caller") {
          navigate("/caller/dashboard");
        } else if (role === "manager") {
          navigate("/manager/dashboard");
        } else {
          showError("Invalid role. Please contact support.");
        }
      } else if (data.student) {
        sessionStorage.setItem("user", JSON.stringify(data.student));
      }

      if (data.token) {
        sessionStorage.setItem("admin_token", data.token);
        sessionStorage.setItem("token", data.token);
      }
    } catch (err) {
      console.error("[AdminLogin] Error:", err);
      showError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setPhone("9876543210");
    setPassword("password123");
  };

  return (
    <div className="min-h-[380px] max-w-md mx-auto mt-12 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 py-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">Admin Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Use phone & password to access admin panel.</p>

        {notice && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm ${
              notice.type === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
            }`}
            role="status"
          >
            {notice.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              autoComplete="tel"
              inputMode="numeric"
              placeholder="9876543210"
              className="mt-2 block w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Phone number"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter password"
                className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-2 text-xs text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center mt-8 justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-md text-sm font-medium"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
}
