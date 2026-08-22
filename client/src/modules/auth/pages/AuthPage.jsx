import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authStore";
import "../auth.css";

export default function AuthPage({ mode }) {
    const isRegister = mode === "register";
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "client", companyName: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user, login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (user) return <Navigate to="/dashboard" replace />;

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
            navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-brand">
                <span className="brand-mark">CPS</span>
                <h1>Keep every project moving smoothly.</h1>
                <p>One unified enterprise portal for clients, material suppliers, finance, operations, and construction managers.</p>
            </section>

            <section className="auth-card-container">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <span className="eyebrow">CPS Management System</span>
                        <h2>{isRegister ? "Create Portal Account" : "Welcome back"}</h2>
                        <p>{isRegister ? "Register your profile to access your dedicated workspace." : "Sign in to access your dashboard and project site maps."}</p>
                    </div>

                    <form onSubmit={submit} className={isRegister ? "register-form-grid" : "login-form-grid"}>
                        {isRegister && (
                            <>
                                <div className="form-group span-2">
                                    <label htmlFor="auth-role">Account Type / Workspace Role *</label>
                                    <select
                                        id="auth-role"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option value="client">Client / Customer (Submit Proposals & Track Projects)</option>
                                        <option value="supplier">Supplier / Material Vendor (Fulfill POs & Sell Materials)</option>
                                        <option value="operations_officer">Operations Officer (Daily Field Site & Logistics)</option>
                                        <option value="manager">Manager (Project Supervision & Approvals)</option>
                                        <option value="accounts_officer">Accounts / Finance Officer (Unified Head of Finance)</option>
                                        <option value="admin">Administrator (Super-user System Access)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="auth-name">Full Name *</label>
                                    <input
                                        id="auth-name"
                                        required
                                        minLength="2"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        autoComplete="name"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="auth-phone">Phone Number *</label>
                                    <input
                                        id="auth-phone"
                                        required
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        autoComplete="tel"
                                        placeholder="+880 1700-000000"
                                    />
                                </div>

                                {form.role === "supplier" && (
                                    <div className="form-group span-2">
                                        <label htmlFor="auth-company">Vendor / Supplier Company Name *</label>
                                        <input
                                            id="auth-company"
                                            required
                                            placeholder="e.g. Heidelberg Cement Bangladesh Ltd"
                                            value={form.companyName}
                                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className={`form-group ${isRegister ? "span-2" : ""}`}>
                            <label htmlFor="auth-email">Email Address *</label>
                            <input
                                id="auth-email"
                                required
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                autoComplete="email"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className={`form-group ${isRegister ? "span-2" : ""}`}>
                            <label htmlFor="auth-password">Password *</label>
                            <div className="password-field">
                                <input
                                    id="auth-password"
                                    required
                                    minLength="8"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    autoComplete={isRegister ? "new-password" : "current-password"}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="form-group span-2" style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", marginTop: "4px" }}>
                                <p className="form-error" role="alert" style={{ color: "#dc2626", margin: 0, fontWeight: "700", fontSize: "13px" }}>
                                    ⚠️ {error}
                                </p>
                            </div>
                        )}

                        <div className="form-group span-2">
                            <button type="submit" disabled={submitting} className="auth-submit-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                {submitting ? (
                                    <>
                                        <span style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid rgba(255,255,255,0.4)",
                                            borderTopColor: "#ffffff",
                                            borderRadius: "50%",
                                            animation: "cpsAuthBtnSpin 0.6s linear infinite"
                                        }} />
                                        <span>{isRegister ? "Creating Account..." : "Signing In..."}</span>
                                    </>
                                ) : (
                                    <span>{isRegister ? "Create Portal Account" : "Sign In to Console →"}</span>
                                )}
                            </button>
                            <style>{`
                                @keyframes cpsAuthBtnSpin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    </form>

                    <div className="auth-switch">
                        <p>
                            {isRegister ? "Already registered with CPS?" : "Don't have a CPS account yet?"}{" "}
                            <Link to={isRegister ? "/login" : "/register"}>
                                {isRegister ? "Sign in here" : "Create an account"}
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
