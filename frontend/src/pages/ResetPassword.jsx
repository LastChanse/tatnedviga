import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ResetPassword.css";

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);
  const navigate = useNavigate();

  // Check if token is valid when component mounts
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        await axios.get(
          `http://localhost:8000/api/password-reset-confirm/${uidb64}/${token}/`
        );
        setIsValidToken(true);
      } catch (err) {
        setIsValidToken(false);
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };

    checkTokenValidity();
  }, [uidb64, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `http://localhost:8000/api/password-reset-confirm/${uidb64}/${token}/`,
        { new_password: newPassword }
      );

      setMessage(
        response.data.message || "Password has been reset successfully"
      );

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "An error occurred. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return <div className="loading">Loading...</div>;
  }

  if (isValidToken === false) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <h2>Invalid Reset Link</h2>
          <div className="alert alert-danger">{error}</div>
          <Link to="/forgot-password" className="btn btn-primary">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <h2>Reset Your Password</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
