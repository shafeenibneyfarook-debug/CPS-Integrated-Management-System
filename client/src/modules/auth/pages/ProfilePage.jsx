import { useState } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../authStore";
import "../auth.css";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        currentPassword: "",
        newPassword: ""
    });
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);

    const formatRoleTitle = (r) => {
        switch (r) {
            case "admin": return { label: "Administrator", color: "#ef4444", bg: "#fef2f2", icon: "🛡️" };
            case "manager": return { label: "Manager", color: "#3b82f6", bg: "#eff6ff", icon: "📊" };
            case "accounts_officer": return { label: "Accounts Officer", color: "#10b981", bg: "#ecfdf5", icon: "💳" };
            case "operations_officer": return { label: "Operations Officer", color: "#f59e0b", bg: "#fffbeb", icon: "🏗️" };
            case "staff": return { label: "Operations Staff", color: "#f59e0b", bg: "#fffbeb", icon: "👷" };
            case "supplier": return { label: "Material Vendor / Supplier", color: "#a855f7", bg: "#faf5ff", icon: "🚢" };
            default: return { label: "Client Account", color: "#0284c7", bg: "#f0f9ff", icon: "🏢" };
        }
    };

    const getRolePermissions = (r) => {
        switch (r) {
            case "admin":
                return [
                    "Full Access Control & System Settings",
                    "User Management & Role Assignment",
                    "Material Price Scraper Review & Overrides",
                    "Global Enterprise Dashboards & Analytics"
                ];
            case "manager":
                return [
                    "Projects & Site Operations Management",
                    "Tenders, Proposals & Quotation Approvals",
                    "Inventory Stock Controls & Allocation",
                    "Import Landed Cost & Profit Estimations"
                ];
            case "accounts_officer":
                return [
                    "Invoices Generation & Payment Reminders",
                    "Partial Payment Receipts & Financial Audit",
                    "Tenders & Financial Quotations Access",
                    "Import Duty, Tax & Currency Conversion"
                ];
            case "operations_officer":
            case "staff":
                return [
                    "Field Projects & Site Maps Coordination",
                    "Inventory Stock Movement (In/Out/Wastage)",
                    "Shipment & Logistics Dispatch Tracking",
                    "Client & Supplier Directory Search"
                ];
            case "supplier":
                return [
                    "Material Purchase Orders Fulfillment",
                    "Shipments Tracking & Dispatches",
                    "Live Scraped Material Market Prices",
                    "Product Catalog & Price Alert Subscriptions"
                ];
            default:
                return [
                    "Client Workspace Dashboard",
                    "Draft BOQ Project Cost Estimator",
                    "Budget-Based Product Package Recommendations",
                    "My Invoices, Payment History & Proposals"
                ];
        }
    };

    const roleInfo = formatRoleTitle(user?.role);
    const permissions = getRolePermissions(user?.role);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setLoading(true);
        try {
            const payload = { name: form.name, phone: form.phone };
            if (form.newPassword) {
                Object.assign(payload, { currentPassword: form.currentPassword, newPassword: form.newPassword });
            }
            const { data } = await API.put("/auth/profile", payload);
            await refreshUser();
            setForm((value) => ({ ...value, currentPassword: "", newPassword: "" }));
            setNotice(data.message || "Profile updated successfully!");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header Banner */}
            <div style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "800"
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            {user?.name}
                        </h1>
                        <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
                            {user?.email}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "999px",
                    background: roleInfo.bg,
                    border: `1px solid ${roleInfo.color}33`
                }}>
                    <span style={{ fontSize: "16px" }}>{roleInfo.icon}</span>
                    <strong style={{ color: roleInfo.color, fontSize: "14px" }}>{roleInfo.label}</strong>
                </div>
            </div>

            {/* UNIFIED FIXED 2-COLUMN GRID LAYOUT */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", alignItems: "start" }}>

                {/* LEFT COLUMN: Account Form */}
                <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 20px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                        Account Profile Settings
                    </h2>

                    {error && (
                        <div style={{ background: "#ffe4e6", border: "1px solid #fecdd3", color: "#be123c", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontWeight: "600" }}>
                            ⚠️ {error}
                        </div>
                    )}
                    {notice && (
                        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontWeight: "600" }}>
                            ✓ {notice}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>Full Name:</label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>Email Address (Verified):</label>
                            <input
                                disabled
                                value={user?.email || ""}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "14px" }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>Phone Number:</label>
                            <input
                                required
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                            />
                        </div>

                        {user?.companyName && (
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>Registered Company Name:</label>
                                <input
                                    disabled
                                    value={user.companyName}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "14px" }}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: "12px", paddingTop: "16px", borderTop: "1px dashed #e2e8f0" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 12px 0" }}>Change Security Password</h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Current Password:</label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.currentPassword}
                                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>New Password (min 8 chars):</label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        minLength="8"
                                        placeholder="••••••••"
                                        value={form.newPassword}
                                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                                    />
                                </div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}>
                                    <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
                                    Show password characters
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "16px",
                                padding: "12px",
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}
                        >
                            {loading ? "Saving Changes..." : "Save Profile Changes"}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Role Workspace Access & Permissions Summary Panel */}
                <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                        Role Workspace Access
                    </h2>

                    <div style={{ background: roleInfo.bg, padding: "16px", borderRadius: "12px", border: `1px solid ${roleInfo.color}33`, marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: roleInfo.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>ACTIVE USER ROLE</div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                            {roleInfo.icon} {roleInfo.label}
                        </div>
                    </div>

                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155" }}>Authorized System Features:</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {permissions.map((p, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "start", gap: "10px", fontSize: "13px", color: "#475569" }}>
                                <span style={{ color: "#10b981", fontWeight: "800" }}>✓</span>
                                <span>{p}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#94a3b8" }}>
                        🔒 Security Clearance ID: <strong style={{ color: "#64748b" }}>{user?._id}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
