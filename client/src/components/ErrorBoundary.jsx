import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontFamily: "system-ui, -apple-system, sans-serif"
                }}>
                    <div style={{
                        maxWidth: "500px",
                        width: "100%",
                        background: "#ffffff",
                        padding: "32px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        textAlign: "center"
                    }}>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
                        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                            Something went wrong in the workspace
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
                            {this.state.error?.message || "An unexpected rendering issue occurred."}
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: "10px 20px",
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.href = "/login";
                                }}
                                style={{
                                    padding: "10px 20px",
                                    background: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Re-login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
