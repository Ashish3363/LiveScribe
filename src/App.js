import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Overlay from "./components/Overlay";
import "./App.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  return (
    <Router>
      <Routes>
        {/* If authenticated, go to Dashboard; otherwise, show Login */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthLayout setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthLayout isRegister={true} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </Router>
  );
}

function AuthLayout({ setIsAuthenticated, isRegister = false }) {
  return (
    <div className="app-container">
      <div className="left-side">
        <div className="auth-block">
          {isRegister ? <Register /> : <Login setIsAuthenticated={setIsAuthenticated} />}
        </div>
      </div>
      <div className="right-side">
        <h1>LiveScribe</h1>
        <p className="welcome-text">Real-time speech-to-text transcript with a beautiful and intuitive interface</p>
        <p className="new-line"><i className="bi bi-mic"></i> Live transcript with high accuracy</p>
        <p className="new-line"><i className="bi bi-mic"></i> Save and manage your transcripts</p>
        <p className="new-line"><i className="bi bi-mic"></i> Easy to use interface</p>
      </div>
    </div>
  );
}

export default App;
