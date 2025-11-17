import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import Home from "./pages/homePage.jsx";
import Footer from "./components/footer.jsx";
import AuthRegister from "./pages/register&Login/authRegister.jsx";
import BookDemo from "./pages/BookSoltPage.jsx"; 
import CandidateDashboard from "./pages/candidateDashboard/CandidateDashboard.jsx";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/RegistrationForm" element={<AuthRegister />} />
        <Route path="/demo" element={<BookDemo />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
