import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState(""); // Feedback to the user
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://44.203.160.46:8000/login", formData);
      const { token, role, username } = response.data;

      // Save the token and role to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Call onLogin to update global state
      onLogin(username, role);

      setMessage("Login successful!");
      setIsError(false);

      // Redirect based on role
      if (role === "administrator") {
        navigate("/dashboard");
      } else if (role === "relief_worker") {
        navigate("/map");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setMessage(
        error.response?.data?.detail || "Login failed. Please check your credentials."
      );
      setIsError(true);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Login</h1>
      {message && (
        <div
          className={`alert ${isError ? "alert-danger" : "alert-success"}`}
          role="alert"
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-50 mx-auto shadow p-4 rounded">
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>
        <button type="submit" className="btn btn-success w-100">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
