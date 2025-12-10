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


// Add a request interceptor to attach Authorization header from sessionStorage
api.interceptors.request.use(
  (config) => {
    try {
      // Try sessionStorage first
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (token) {
        config.headers = config.headers ?? {};
        // if token already has "Bearer " prefix, don't double-prefix
        config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
      }
    } catch (e) {
      // ignore storage errors
      console.warn("Could not read token from storage:", e?.message || e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthAPI = { 
  sendOTP: (data) => api.post("/student/send-otp", data),
  register: (data) => api.post("/student/register", data),
  sendCredentials: (data) => api.post("/student/send-credentials", data),
  login: (data) => api.post("/student/login", data),
  logout: () => api.post("/student/logout"),
  getStudentProfile: () => api.get("/student/profile"),
  GetDemoSlots: () => api.get("/student/getAllSlots"),
   BookDemoSlot: (data) => api.post("/student/registerSlot", data),  
  SubmitSupportQuery: (payload) => api.post("/student/submit-query", payload),
  GetStudentSupportQueries: () => api.get("/student/student-queries"),
  GetAllSupportQueries: () => api.get("/student/all-queries"),
  UpdateSupportQueryStatus: (queryId, status) =>
    api.put(`/student/update-status/${queryId}`, { status }),
  AddSupportQueryResponse: (queryId, message) =>
    api.post(`/student/add-response/${queryId}`, { message }),
  createReferral: (data = {}, config = {}) => api.post("/student/create", data, config),
  getReferralInfo: (code) => api.get(`/student/info/${encodeURIComponent(code)}`),
  sendReferralOTP: (data) => api.post("/student/send-otp", data),
  registerWithReferral: (payload, userId) => api.post(`/student/register?userId=${encodeURIComponent(userId)}`, payload),
  // optionally add getStudentById if you want
  getStudentById: (id) => api.get(`/student/${id}`),


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
  GetAllSupportQueries: (filter) => 
    filter !== "all" ? api.get("/admin/support/all-queries", { params: { status: filter } }) : api.get("/admin/support/all-queries"),
  GetStudentSupportQueries: () => api.get("/admin/support/student-queries"),
  UpdateSupportQueryStatus: (queryId, status) =>
    api.put(`/admin/support/update-status/${queryId}`, { status }),
  AddSupportQueryResponse: (queryId, message) =>
    api.post(`/admin/support/add-response/${queryId}`, { message }),
  DeleteSupportQuery: (queryId) =>
    api.delete(`/admin/support/delete-query/${queryId}`),

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


  // Admin Auth Router  registerAdmin: (data) => api.post("/admin/register", data),
  loginAdmin: (data) => api.post("/admin/login", data),
  logoutAdmin: () => api.post("/admin/logout"),
  getAdminProfileById: (id) => api.get(`/admin/profile/${id}`),
  registerAdmin: (data) => api.post("/admin/register", data),
  verifyAdminOtp: (data) => api.post("/admin/verify-otp", data),
  sendAdminOtp: (data) => api.post("/admin/send-otp", data),


};

export const ReferralAPI = {
}

export const AdmitCardAPI = {

  getAdmitCardById: (id) => api.get(`/admit-cards/${id}`),
  generatePresentToken: (id) => api.post(`/admit-cards/${id}/present-token`),
  markAttendanceWithToken: (data) => api.post("/admit-cards/mark-attendance", data),
  scanAttendance: (id) => api.get(`/admit-cards/scan-attendance/${id}`),
  downloadAdmitCard: (id) => api.get(`/admit-cards/${id}/download`, { responseType: 'blob' }),
};


export const CallerAPI = {
listCallers: () => api.get("/callers/"),
};

export default api;
