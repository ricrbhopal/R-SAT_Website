// src/pages/modals/EditModal.jsx
import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../../../config/api"; // adjust path if necessary

/**
 * EditModal
 * - If initialData is provided (referral doc), tries to read referredStudentId / referredStudent to fetch student.
 * - If studentId prop is provided and initialData doesn't include referredStudentId, tries to fetch student by that id.
 * - Populates form using Student model fields where available.
 * - On Save, calls AdminAPI.putRefferedUserDetails(id, payload) to update the referred record.
 */

export default function EditModal({ studentId, initialData = null, onClose }) {
  const [studentDoc, setStudentDoc] = useState(null); // raw student object (if found)
  const [referralDoc, setReferralDoc] = useState(null); // if initialData is the referral record
  const [formData, setFormData] = useState({
    studentID: "", // student.student_ID
    name: "",
    email: "",
    phone: "",
    college: "",
    branch: "",
    academicYear: "",
    dob: "",
    referralCode: "",
    referredOn: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyStudent = (student, referral = null) => {
      // student: expected shape from Student model
      const studentID = student?.student_ID ?? "";
      const fullName = student?.fullName ?? "";
      const email = student?.mail_ID ?? "";
      const phone = student?.phoneNo ?? "";
      const college = student?.college ?? "";
      const branch = student?.branch ?? "";
      const year = student?.year ?? "";
      const dob = student?.dob ? new Date(student.dob).toLocaleDateString() : "";
      const referredOn = referral?.referredDate ? new Date(referral.referredDate).toLocaleString() : (referral?.createdAt ? new Date(referral.createdAt).toLocaleString() : "");

      setStudentDoc(student);
      setReferralDoc(referral);
      setFormData({
        studentID,
        name: fullName,
        email,
        phone,
        college,
        branch,
        academicYear: year,
        dob,
        referralCode: referral?.refCode ?? referral?.referrerStudentID ?? "",
        referredOn,
      });
    };

    const applyReferralOnly = (ref) => {
      // no student fetch possible, fill from referral doc
      const referredName = ref?.referredName ?? "";
      const referredEmail = ref?.referredEmail ?? "";
      const referredPhone = ref?.referredPhone ?? "";
      const collegeName = ref?.collegeName ?? "";
      const year = ref?.year ?? "";
      const refCode = ref?.refCode ?? ref?.referrerStudentID ?? "AUTO-GENERATED-CODE"; // Fallback to auto-generated code if missing
      const referredOn = ref?.referredDate ? new Date(ref.referredDate).toLocaleString() : (ref?.createdAt ? new Date(ref.createdAt).toLocaleString() : "");
      setReferralDoc(ref);
      setFormData({
        studentID: ref?.referrerStudentID ?? "",
        name: referredName,
        email: referredEmail,
        phone: referredPhone,
        college: collegeName,
        branch: ref?.branch ?? "",
        academicYear: year,
        dob: ref?.dob ? new Date(ref.dob).toLocaleDateString() : "",
        referralCode: refCode,
        referredOn,
      });
    };

    const fetchStudentById = async (idToFetch, referral = null) => {
      // Try AdminAPI.getStudentById or other fallbacks
      const tries = ["getStudentById", "getStudentDetails", "getStudentDetailsById", "getStudent"];
      let fetched = null;
      for (const fn of tries) {
        if (typeof AdminAPI[fn] === "function") {
          try {
            const res = await AdminAPI[fn](idToFetch);
            fetched = res?.data ?? res;
            if (fetched) break;
          } catch (err) {
            // continue trying other functions
            console.warn(`[EditModal] ${fn} failed:`, err?.response?.data ?? err?.message ?? err);
          }
        }
      }

      // Generic fallback GET if AdminAPI has a generic get method
      if (!fetched && typeof AdminAPI.get === "function") {
        try {
          const res = await AdminAPI.get(`/admin/students/${idToFetch}`);
          fetched = res?.data ?? res;
        } catch (err) {
          console.warn("[EditModal] generic GET /admin/students/:id failed:", err?.response?.data ?? err?.message ?? err);
        }
      }

      if (!cancelled) {
        if (fetched) {
          applyStudent(fetched, referral);
        } else {
          // no student found — fall back to referral-only data
          if (referral) applyReferralOnly(referral);
          else {
            // nothing — initialize empty
            setFormData((f) => ({ ...f, referralCode: "", referredOn: "" }));
          }
        }
      }
    };

    const init = async () => {
      try {
        setLoading(true);

        // If initialData provided and it looks like a referral record, prefer it
        if (initialData) {
          // detect if initialData is referral doc by checking presence of referredName / refCode etc.
          const looksLikeReferral = Boolean(initialData?.refCode || initialData?.referredName || initialData?.referredStudentId || initialData?.referrerStudentID);
          if (looksLikeReferral) {
            // Try to fetch referred student if referredStudentId exists
            const referredStudentId = initialData?.referredStudentId ?? initialData?.referredStudent?._id ?? initialData?.referredStudent?.id ?? null;
            if (referredStudentId) {
              await fetchStudentById(referredStudentId, initialData);
            } else {
              // maybe student is not registered yet — just apply referral fields
              applyReferralOnly(initialData);
            }
            return;
          }
          // if initialData looks like a Student doc already
          const looksLikeStudent = Boolean(initialData?.student_ID || initialData?.fullName || initialData?.mail_ID);
          if (looksLikeStudent) {
            applyStudent(initialData, null);
            return;
          }
        }

        // If no initialData or initialData was not a referral, try to use studentId prop
        if (studentId) {
          // studentId may be a referral id — attempt to fetch referral first to get referredStudentId
          let referralFetch = null;
          // Try AdminAPI.getRefferedUserById or similar
          const referralTries = ["getRefferedUserById", "getReferredById", "getReferralById", "getReferred"];
          for (const fn of referralTries) {
            if (typeof AdminAPI[fn] === "function") {
              try {
                const rres = await AdminAPI[fn](studentId);
                referralFetch = rres?.data ?? rres;
                break;
              } catch (err) {
                // ignore
              }
            }
          }

          if (referralFetch) {
            const referredStudentId = referralFetch?.referredStudentId ?? referralFetch?.referredStudent?._id ?? referralFetch?.referredStudent?.id ?? null;
            if (referredStudentId) {
              // fetch student by the referredStudentId
              await fetchStudentById(referredStudentId, referralFetch);
              return;
            } else {
              // there was a referral doc but no referredStudentId (maybe unregistered) — fill referral
              applyReferralOnly(referralFetch);
              return;
            }
          }

          // If referral fetch failed, try to fetch a student directly by studentId
          await fetchStudentById(studentId, null);
          return;
        }

        // Nothing available — leave default empty form
      } catch (err) {
        console.error("[EditModal] init error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [studentId, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // This modal updates the referred record (referral) using AdminAPI.putRefferedUserDetails
    // Determine id to update: prefer referralDoc.id, else studentId prop
    const idToUpdate = referralDoc?.id ?? referralDoc?._id ?? studentId;

    if (!idToUpdate) {
      alert("No referral id available to update.");
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
        // Note: refCode is typically unique and might be disabled in UI; omit writing refCode unless you want to allow editing
        // refCode: formData.referralCode,
      };

      // call API
      if (typeof AdminAPI.putRefferedUserDetails === "function") {
        await AdminAPI.putRefferedUserDetails(idToUpdate, payload);
      } else {
        // fallback generic PUT
        await AdminAPI.put?.(`/admin/referred/${idToUpdate}`, payload);
      }

      alert("Referred user updated successfully.");
      onClose();
    } catch (error) {
      const msg = error?.response?.data?.message ?? "Failed to save. Please try again.";
      alert(msg);
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
              <input name="studentID" type="text" value={formData.studentID} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input name="name" type="text" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Email" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input name="phone" type="text" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Phone" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
              <input name="college" type="text" value={formData.college} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="College" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <input name="branch" type="text" value={formData.branch} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Branch" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
              <input name="academicYear" type="text" value={formData.academicYear} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Academic Year" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DOB</label>
              <input name="dob" type="text" value={formData.dob} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100" placeholder="Date of birth" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code</label>
              <input name="referralCode" type="text" value={formData.referralCode} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Referred On</label>
              <input name="referredOn" type="text" value={formData.referredOn} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100" />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700">Cancel</button>
              <button type="submit" disabled={isSaving} className={`px-5 py-2 rounded-xl text-white font-medium ${isSaving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
