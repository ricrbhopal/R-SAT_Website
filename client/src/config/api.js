import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4500';

const api = axios.create({
  baseURL: BASE_URL, // Adjust the base URL as needed
});


 export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
    delete api.defaults.headers.common['Authorization'];
  }
};


export const AuthAPI = {
  sendOTP: (data) => api.post('/auth/send-otp', data),
  register: (data) => api.post('/auth/register', data),
  sendCredentials: (data) => api.post('/auth/send-credentials', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getStudentProfile: () => api.get('/auth/profile'),
};



export const DemoAPI ={
  bookDemoSlot: (data) => api.post('/solt/registerSolt', data),
  getAllDemoSlots: () => api.get('/solt/getAllSolts'),
}

export default api;