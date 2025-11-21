// src/pages/modals/EditModal.jsx
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../../../config/api"; // adjust path if necessary

export default function EditModal({ studentId, initialData = null, onClose }) {
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    academicYear: "",
    referralCode: "",
    referredOn: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyInitialData = (data) => {
      // `data` can be a referral doc or a student doc; normalize accordingly
      const ref = data?.referrerId ?? data?.referrer ?? {};
      const referredName =
        data?.referredName ?? data?.fullName ?? data?.name ?? data?.studentName ?? "";
      const referredEmail = data?.referredEmail ?? data?.mail_ID ?? data?.email ?? "";
      const referredPhone = data?.referredPhone ?? data?.phoneNo ?? data?.phone ?? "";
      const collegeName = data?.collegeName ?? data?.college ?? "";
      const year = data?.year ?? data?.academicYear ?? "";
      const refCode = data?.refCode ?? data?.referralCode ?? data?.referral ?? "";
      const referredOn = new Date(data?.referredDate ?? data?.createdAt ?? Date.now()).toLocaleString();

      setStudent(data);
      setFormData({
        name: referredName,
        email: referredEmail,
        phone: referredPhone,
        college: collegeName,
        academicYear: year,
        referralCode: refCode,
        referredOn,
      });
    };

    const fetchStudentIfNeeded = async () => {
      if (initialData) {
        applyInitialData(initialData);
        setLoading(false);
        return;
      }

      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("[EditModal] Fetching details for ID:", studentId);

        // Try multiple AdminAPI helpers (be tolerant of naming differences)
        const tries = [
          "getStudentById",
          "getStudentDetails",
          "getStudentDetailsById",
          "getReferredById",
          "getRefferedUserById",
        ];

        let fetched = null;
        for (const fn of tries) {
          if (typeof AdminAPI[fn] === "function") {
            try {
              const res = await AdminAPI[fn](studentId);
              fetched = res?.data ?? res;
              console.log(`[EditModal] fetched via ${fn}`, fetched);
              break;
            } catch (err) {
              // log and continue trying other functions
              console.warn(`[EditModal] ${fn} failed:`, err?.message || err);
            }
          }
        }

        // If nothing found yet, try a generic GET (best-effort) - adjust baseURL if necessary
        if (!fetched) {
          try {
            const res = await AdminAPI.get?.(`/admin/students/${studentId}`);
            fetched = res?.data ?? res;
            console.log("[EditModal] fetched via generic /admin/students/:id", fetched);
          } catch (err) {
            // ignore - we'll handle not found below
            console.warn("[EditModal] generic fetch failed:", err?.message || err);
          }
        }

        if (!cancelled) {
          if (fetched) {
            applyInitialData(fetched);
          } else {
            // As a fallback, populate minimal values using the id (so modal still opens)
            setStudent({ _id: studentId });
            setFormData((f) => ({ ...f, referralCode: f.referralCode || "", referredOn: f.referredOn || "" }));
            console.warn("[EditModal] No data found for id, opened modal with minimal data.");
          }
        }
      } catch (error) {
        console.error("[EditModal] Failed to fetch student details:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudentIfNeeded();

    return () => {
      cancelled = true;
    };
  }, [studentId, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!student && !studentId) {
      alert("No student to update.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        fullName: formData.name,
        mail_ID: formData.email,
        phoneNo: formData.phone,
        collegeName: formData.college,
        year: formData.academicYear,
        refCode: formData.referralCode,
        // Map other fields here if needed
      };

      const idToUpdate = student?._id ?? studentId;
      await AdminAPI.putRefferedUserDetails(idToUpdate, payload);

      alert("Referred user updated successfully.");
      onClose();
    } catch (error) {
      console.error("[EditModal] Failed to save referred user details:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform">
          <div className="p-6">
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Student / Referral</h2>
            <p className="text-sm text-gray-500">Update details and save</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
        </div>

        <div className="p-6">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Phone"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
              <input
                name="college"
                type="text"
                value={formData.college}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="College"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
              <input
                name="academicYear"
                type="text"
                value={formData.academicYear}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Academic Year"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code</label>
              <input
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Referral Code"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referred On</label>
              <input
                name="referredOn"
                type="text"
                value={formData.referredOn}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100"
                placeholder="Referred On"
                disabled
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700">Cancel</button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 rounded-xl text-white font-medium ${isSaving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
