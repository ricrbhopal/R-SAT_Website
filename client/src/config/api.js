import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:6501";

const api = axios.create({
  baseURL: BASE_URL, // Adjust the base URL as needed
  withCredentials: true,
});

// ensure cookies (token cookie) are sent with requests when server sets them
api.defaults.withCredentials = true;

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};


// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const AuthAPI = {
  sendOTP: (data) => api.post("/auth/send-otp", data),
  register: (data) => api.post("/auth/register", data),
  sendCredentials: (data) => api.post("/auth/send-credentials", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getStudentProfile: () => api.get("/auth/profile"),
};

export const DemoAPI = {
  sendDemoOTP: (data) => api.post("/slot/send-otp", data),
  bookDemoSlot: (data) => api.post("/slot/registerSlot", data),
  getAllDemoSlots: () => api.get("/slot/getAllSlots"),
};

export const SupportAPI = {
  SubmitSupportQuery: (payload) => api.post("/support/submit-query", payload),
  GetStudentSupportQueries: () => api.get("/support/student-queries"),
  GetAllSupportQueries: () => api.get("/support/all-queries"),
  UpdateSupportQueryStatus: (queryId, status) =>
    api.put(`/support/update-status/${queryId}`, { status }),
  AddSupportQueryResponse: (queryId, responder, message) =>
    api.put(`/support/add-response/${queryId}`, { responder, message }),
};

// Referral API
export const ReferralAPI = {
  // Create referral (authenticated). Pass optional axios config to include Authorization header.
  createReferral: (data = {}, config = {}) => api.post("/referrals/create", data, config),

  // Get referral info by referral code
  getReferralInfo: (code) => api.get(`/referrals/info/${encodeURIComponent(code)}`),

  // Register with referral (public)
  registerWithReferral: (data, ref) => {
    if (!ref) throw new Error("Referral code is required for registration.");
    return api.post(`/referrals/register?ref=${encodeURIComponent(ref)}`, data);

  },
  sendReferralOTP: (data) => {
    return api.post("/referrals/send-otp", data);
  },
};


export const AdminAPI = {
  // User Router
  getAllStudents: () => api.get("/admin/users"),
  getStudentById: (studentId) => api.get(`/admin/user/${studentId}`),
  updateStudent: (studentId, studentData) =>
    api.put(`/admin/user/${studentId}`, studentData),

  deleteStudent: (studentId) => api.delete(`/admin/user/${studentId}`),


  // Referred User Router
  getRefferedUsers: () => api.get("/admin/reffered-users"),
  deleteRefferedUser: (userId) => api.delete(`/admin/reffered-user/${userId}`),
  putRefferedUserDetails: (userId, userData) =>
    api.put(`/admin/reffered-user/${userId}`, userData),

  getRefferedUserById: (userId) => api.get(`/admin/reffered-user/${userId}`),

  // Demo Class Router
  getAllDemoClasses: () => api.get("/admin/demo-classes"),
  getDemoClassById: (demoClassId) => api.get(`/admin/demo-class/${demoClassId}`),
  putDemoClassDetails: (demoClassId, demoClassData) =>
    api.put(`/admin/demo-class/${demoClassId}`, demoClassData),
  deleteDemoClass: (demoClassId) => api.delete(`/admin/demo-class/${demoClassId}`),

  // Admit Card Router
bulkCreateAdmitCards: (data) => api.post("/admin/bulk", data),
  bulkUpdateAdmitCards: (data) => api.put("/admin/bulk-update", data),
    getAllAdmitCards: () => api.get("/admin/all"),
  updateAdmitCard: (id, data) => api.put(`/admin/${id}`, data),
  getAdmitCardById: (id) => api.get(`/admin/${id}`),
  deleteAdmitCard: (id) => api.delete(`/admin/${id}`),
  updateAdmitCardStatus: (id, status) =>
    api.put(`/admin/${id}/status`, { status }),


  // Support Query Router
  GetAllSupportQueries: () => api.get("/admin/support/all-queries"),
  GetStudentSupportQueries: () => api.get("/admin/support/student-queries"),
  UpdateSupportQueryStatus: (queryId, status) =>
    api.put(`/admin/support/update-status/${queryId}`, { status }),
  AddSupportQueryResponse: (queryId, responder, message) =>
    api.put(`/admin/support/add-response/${queryId}`, { responder, message }),


  // Attendance Router
  generatePresentToken: (id) => api.post(`/admin/${id}/present-token`),
  markAttendanceWithToken: (data) => api.post("/admin/mark-attendance", data),


  // Result Router
  getAllResultsWithStudentDetails: () => api.get("/admin/results/all-with-student-details"),
  deleteResult: (id) => api.delete(`/admin/results/${id}`),
  updateResult: (id, data) => api.put(`/admin/results/${id}`, data),
  getResultByStudentId: (studentId) => api.get(`/admin/results/student/${studentId}`),
  getAllResults: () => api.get("/admin/results/all"),
  createResult: (data) => api.post("/admin/results/create", data),



};



export const AdmitCardAPI = {

  getAdmitCardById: (id) => api.get(`/admit-cards/${id}`),
  generatePresentToken: (id) => api.post(`/admit-cards/${id}/present-token`),
  markAttendanceWithToken: (data) => api.post("/admit-cards/mark-attendance", data),
  scanAttendance: (id) => api.get(`/admit-cards/scan-attendance/${id}`),
  downloadAdmitCard: (id) => api.get(`/admit-cards/${id}/download`, { responseType: 'blob' }),
};

export default api;
