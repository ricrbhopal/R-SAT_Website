import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.jsx";
import HOme from '../src/pages/homePage.jsx';
import Footer from "./components/footer.jsx";
import AuthRegister from "../src/pages/register&Login/authRegister.jsx";
import './App.css'


function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HOme />} />
          <Route path="/RegisterationForm" element={<AuthRegister />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
