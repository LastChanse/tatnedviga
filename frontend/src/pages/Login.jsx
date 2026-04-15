import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Form from "../components/Form.jsx";
// import "../styles/auth.css";

function Login() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.preventBack) {
      window.history.pushState(null, document.title, window.location.href);

      const handleBackButton = (e) => {
        e.preventDefault();
        window.history.pushState(null, document.title, window.location.href);
      };

      window.addEventListener("popstate", handleBackButton);

      // Cleanup
      return () => {
        window.removeEventListener("popstate", handleBackButton);
      };
    }
  }, [location]);

  return (
      <>
    <div>
      <Form route="/api/token/" method="login" />
      <p className="auth-link">
        <Link to="/forgot-password">Forgot Password?</Link>
      </p>
      <p className="auth-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
          </>
  );
}

export default Login;
