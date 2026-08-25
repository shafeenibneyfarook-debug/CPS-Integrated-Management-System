import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authStore";

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                color: "#0f172a",
                fontFamily: "system-ui, -apple-system, sans-serif"
            }}>
                <div style={{
                    width: "42px",
                    height: "42px",
                    border: "4px solid #e2e8f0",
                    borderTopColor: "#2563eb",
                    borderRadius: "50%",
                    animation: "cpsAuthSpin 0.7s linear infinite"
                }} />
                <p style={{ marginTop: "16px", color: "#64748b", fontWeight: "700", fontSize: "14px", letterSpacing: "0.5px" }}>
                    Loading your workspace...
                </p>
                <style>{`
                    @keyframes cpsAuthSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}
