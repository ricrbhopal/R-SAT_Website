import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import Home from "../../client/src/pages/HomePage.jsx";
import Footer from "./components/footer.jsx";
import AuthRegister from "./pages/register&Login/authRegister.jsx";
import CandidateDashboard from "./pages/candidateDashboard/CandidateDashboard.jsx";
import BookDemo from "./pages/candidateDashboard/BookDemoPage.jsx";
import Profile from "../src/pages/candidateDashboard/ProfilePage.jsx";
import ReferredPage from "./pages/candidateDashboard/RefferedPage.jsx";
import ReferredRegistrationPage from "./pages/candidateDashboard/RefferedRegisterationPage.jsx";
import Admindashboard from "./pages/adminDashboard/AdminDashboard.jsx";
import ManagerDashboard from "./pages/managerDashboard/ManagerDashboard.jsx";
import Login from "./pages/register&Login/AdminLogin.jsx";
import AdminRegister from "./pages/adminDashboard/AdminRegister.jsx";
import CallerDashboard from "./pages/callerDashboard/CallerDashboard.jsx";
import CallerRefferedRegisteration from "./pages/callerDashboard/CallerRefferedRegisteration.jsx";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/RegistrationForm" element={<AuthRegister />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/demo" element={<BookDemo />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/candidateDashboard/referred" element={<ReferredPage />} />
        <Route
          path="/candidateDashboard/RefferedRegisterationPage"
          element={<ReferredRegistrationPage />}
        />
        <Route path="/callerDashboard/RefferedRegisterationPage" element={<CallerRefferedRegisteration />} />
        <Route path="/admin/dashboard" element={<Admindashboard />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/caller/dashboard" element={<CallerDashboard />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
