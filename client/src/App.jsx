import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import Home from "./pages/homePage.jsx";
import Footer from "./components/footer.jsx";
import AuthRegister from "./pages/register&Login/authRegister.jsx";
import CandidateDashboard from "./pages/candidateDashboard/CandidateDashboard.jsx";
import BookDemo from "./pages/candidateDashboard/BookDemoPage.jsx";
import Profile from "../src/pages/candidateDashboard/ProfilePage.jsx";
import ReferredPage from "./pages/candidateDashboard/RefferedPage.jsx";
import ReferredRegistrationPage from "./pages/candidateDashboard/RefferedRegisterationPage.jsx";
import Admindashboard from "./pages/adminDashboard/AdminDashboard.jsx"
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
        <Route path="/admin/dashboard" element={<Admindashboard />} />
      </Routes>
      
      <Footer />
    </BrowserRouter>
  );
}

export default App;
