import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN);
            
            // If no token exists, user is not authorized
            if (!token) {
                setIsAuthorized(false);
                return;
            }

            try {
                const decoded = jwtDecode(token);
                const tokenExpiration = decoded.exp;
                const now = Date.now() / 1000;

                // If token is expired, try to refresh it
                if (tokenExpiration < now) {
                    await refreshToken();
                } else {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Token validation failed:", error);
                setIsAuthorized(false);
            }
        };

        checkAuth();
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        
        // If no refresh token exists, user needs to log in
        if (!refreshToken) {
            setIsAuthorized(false);
            return;
        }

        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });
            
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            } else {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            // Clear tokens on any error
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            setIsAuthorized(false);
        }
    };

    // Show loading state while checking auth
    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    // Redirect to login if not authorized, otherwise render children
    return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
