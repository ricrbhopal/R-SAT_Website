import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4500";

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

export const ReferralAPI = {
  createReferral: (data) => api.post("/reffered/create", data),
  getReferralInfo: (code) => api.get(`/reffered/info/${code}`),
  registerWithReferral: (ref, data) =>
    api.post(`/reffered/register?ref=${ref}`, data),
};

export const AdminAPI = {
  getAllStudents: () => api.get("/admin/users"),
  getStudentById: (studentId) => api.get(`/admin/user/${studentId}`),
  updateStudent: (studentId, studentData) =>
    api.put(`/admin/user/${studentId}`, studentData),

  deleteStudent: (studentId) => api.delete(`/admin/user/${studentId}`)
};

export default api;
