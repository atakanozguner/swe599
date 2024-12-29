import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import RequestForm from "./components/RequestForm";
import Dashboard from "./components/Dashboard";
import Districts from "./components/Districts";
import DistrictDetails from "./components/DistrictDetails";


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Check login status on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
    localStorage.setItem("username", user); // Save username to localStorage
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} username={username} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Register />}
        />
        <Route path="/request-form" element={<RequestForm />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/districts"
          element={isLoggedIn ? <Districts /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/districts/:districtId"
          element={isLoggedIn ? <DistrictDetails /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={isLoggedIn ? <RequestForm /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;
