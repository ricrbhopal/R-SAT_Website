import React, { useState, useEffect } from 'react';
import { AdminAPI } from "../../../../config/api.js";
import { toast } from "react-toastify";

const EditDemoClassModal = ({ demoClass, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    studentName: demoClass.studentName || "",
    email: demoClass.email || "",
    phone: demoClass.phone || "",
    collegeName: demoClass.collegeName || "",
    year: demoClass.year || "",
    demoSlot: demoClass.demoSlot || "",
    type: demoClass.type || "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDemoClassDetails = async () => {
      try {
        const response = await AdminAPI.getDemoClassById(demoClass.id || demoClass._id);
        const fetchedData = response.data;

        setFormData((prevFormData) => ({
          ...prevFormData,
          year: fetchedData.year || "",
          type: fetchedData.type || "",
          studentName: fetchedData.studentName || "",
          email: fetchedData.email || "",
          phone: fetchedData.phone || "",
          collegeName: fetchedData.collegeName || "",
          demoSlot: fetchedData.demoSlot || "",
        }));
      } catch (error) {
        console.error("Error fetching demo class details:", error);
        toast.error("Failed to fetch demo class details. Please try again.");
      }
    };

    if (demoClass?.id || demoClass?._id) {
      fetchDemoClassDetails();
    }
  }, [demoClass]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const response = await AdminAPI.putDemoClassDetails(demoClass.id || demoClass._id, formData);
      toast.success("Demo class updated successfully!");
      onSave(response.data);
    } catch (error) {
      console.error("Error updating demo class:", error);
      toast.error("Error updating demo class. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.005]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-blue-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Edit Demo Class
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Update student information and class details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition duration-200 p-2 hover:bg-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Information Section */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Student Information
              </h4>
            </div>

            <FormField
              label="Student Name"
              name="studentName"
              type="text"
              value={formData.studentName}
              onChange={handleChange}
              error={errors.studentName}
              required
              icon="👤"
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              icon="📧"
            />

            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              icon="📱"
              placeholder="10-digit phone number"
            />

            <FormField
              label="College Name"
              name="collegeName"
              type="text"
              value={formData.collegeName}
              onChange={handleChange}
              icon="🎓"
              placeholder="Enter college name"
            />

            {/* Class Details Section */}
            <div className="lg:col-span-2 mt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Class Details
              </h4>
            </div>

            <SelectField
              label="Academic Year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              options={[
                { value: "", label: "Select your year" },
                { value: "1st Year", label: "1st Year" },
                { value: "2nd Year", label: "2nd Year" },
                { value: "3rd Year", label: "3rd Year" },
                { value: "4th Year", label: "4th Year" },
                { value: "Passed Out", label: "Passed Out" },
              ]}
              icon="📅"
            />

            <SelectField
              label="Preferred Demo Slot"
              name="demoSlot"
              value={formData.demoSlot}
              onChange={handleChange}
              options={[
                { value: "", label: "Select a preferred slot" },
                { value: "2025-11-17 11:00 AM", label: "17-11-2025 11:00 AM" },
                { value: "2025-11-18 02:00 PM", label: "18-11-2025 02:00 PM" },
                { value: "2025-11-19 11:00 AM", label: "19-11-2025 11:00 AM" },
                { value: "2025-11-20 02:00 PM", label: "20-11-2025 02:00 PM" },
                { value: "2025-11-21 11:00 AM", label: "21-11-2025 11:00 AM" },
              ]}
              icon="⏰"
            />

            <SelectField
              label="Demo Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={[
                { value: "", label: "Select Demo Type" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ]}
              icon="🎯"
            />


          </div>
        </form>

        {/* Actions Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {demoClass.updatedAt ? new Date(demoClass.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-2 sm:order-1 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, name, type, value, onChange, error, required = false, icon, placeholder }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      />
      {error && (
        <div className="absolute right-3 top-3">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
    {error && (
      <p className="text-red-600 text-sm mt-2 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const SelectField = ({ label, name, value, onChange, options, icon }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover:border-gray-400 appearance-none bg-white"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default EditDemoClassModal;