import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import RequestForm from "./components/RequestForm";
import Dashboard from "./components/Dashboard";
import Districts from "./components/Districts";
import DistrictDetails from "./components/DistrictDetails";
import InventoryManager from "./components/InventoryManager";
import TransferInventory from "./components/TransferInventory";


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");


  // Check login status on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
      setRole(savedRole);

    }
  }, []);

  const handleLogin = (user, userRole) => {
    setIsLoggedIn(true);
    setUsername(user);
    setRole(userRole);
    localStorage.setItem("username", user); // Save username to localStorage
    localStorage.setItem("role", userRole); // Save role to localStorage

  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
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
          path="/districts/:districtId/inventory"
          element={isLoggedIn && role === "administrator" ? <InventoryManager /> : <Navigate to="/login" replace />}
          onEnter={() => console.log("Role during route check:", role)} // Debugging log

        />
        <Route
          path="/transfer-inventory"
          element={isLoggedIn && role === "administrator" ? <TransferInventory /> : <Navigate to="/login" replace />}
          onEnter={() => console.log("Role during route check:", role)} // Debugging log

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
