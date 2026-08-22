import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function PublicFooter() {
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (newsletterEmail.trim()) {
            setSubscribed(true);
            setNewsletterEmail("");
            setTimeout(() => setSubscribed(false), 5000);
        }
    };

    return (
        <footer style={{
            background: "#080e1e",
            color: "#94a3b8",
            borderTop: "1px solid #1e293b",
            padding: "70px 24px 30px 24px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{
                maxWidth: "1280px",
                margin: "0 auto"
            }}>
                {/* TOP NEWSLETTER / SUPPORT STRIP */}
                <div style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    borderRadius: "16px",
                    padding: "32px 36px",
                    marginBottom: "60px",
                    border: "1px solid #334155",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "24px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}>
                    <div>
                        <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#38bdf8" }}>
                            Stay Updated
                        </span>
                        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", margin: "4px 0 6px 0" }}>
                            Subscribe to Market Intelligence & Material Price Trends
                        </h3>
                        <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, maxWidth: "560px" }}>
                            Receive weekly BD material price indices, BNBC structural guidelines, and freight customs updates directly in your inbox.
                        </p>
                    </div>

                    <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%", maxWidth: "420px" }}>
                        <input
                            type="email"
                            required
                            placeholder="Enter corporate email address..."
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "12px 16px",
                                borderRadius: "8px",
                                background: "#090d16",
                                border: "1px solid #475569",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: "12px 20px",
                                borderRadius: "8px",
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                fontWeight: "700",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "background 0.2s ease",
                                whiteSpace: "nowrap"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#1d4ed8"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#2563eb"}
                        >
                            {subscribed ? "✓ Subscribed!" : "Subscribe"}
                        </button>
                    </form>
                </div>

                {/* MAIN 4-COLUMN LINK GRID */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "40px",
                    marginBottom: "50px"
                }}>
                    {/* Col 1: Brand & Contact Info */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #2563eb, #0284c7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ffffff",
                                fontWeight: "900",
                                fontSize: "18px",
                                boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                            }}>
                                CPS
                            </div>
                            <div>
                                <span style={{ fontWeight: "800", fontSize: "18px", color: "#ffffff", letterSpacing: "-0.3px", display: "block" }}>
                                    CPS Management
                                </span>
                                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Contractor Operations Suite</span>
                            </div>
                        </div>

                        <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#64748b", marginBottom: "20px" }}>
                            The enterprise-grade contractor operations and AI BOQ estimation platform engineered for property developers, project managers, accounts officers, suppliers, and clients across Bangladesh.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#cbd5e1" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>📍</span> <span>Corporate HQ: Level 12, Gulshan-2, Dhaka-1212</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>📞</span> <span>Hotline: +880 (2) 988-0000 / 09612-000000</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>✉️</span> <span>Support: support@cps-procurement.bd.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Platform Modules */}
                    <div>
                        <h4 style={{ color: "#ffffff", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                            Core Platform
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px", fontSize: "13px" }}>
                            <li><Link to="/boq-estimator" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>AI Bangladesh BOQ Estimator</Link></li>
                            <li><Link to="/price-scraper" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Live Material Price Scraper</Link></li>
                            <li><Link to="/inventory" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Inventory & Stock Registry</Link></li>
                            <li><Link to="/import-costs" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Import Cost & Duty Calculator</Link></li>
                            <li><Link to="/quotations" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Client Proposals & Tenders</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Operations & Governance */}
                    <div>
                        <h4 style={{ color: "#ffffff", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                            Role Workspaces
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px", fontSize: "13px" }}>
                            <li><Link to="/projects" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Google Maps Work Sites</Link></li>
                            <li><Link to="/invoices" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Finance Invoice Approvals</Link></li>
                            <li><Link to="/shipments" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Logistics Freight Tracking</Link></li>
                            <li><Link to="/suppliers" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Vendor Capacity Directory</Link></li>
                            <li><Link to="/admin/users" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#38bdf8"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>Admin User Access Control</Link></li>
                        </ul>
                    </div>

                    {/* Col 4: Compliance & Trust Badges */}
                    <div>
                        <h4 style={{ color: "#ffffff", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                            Security & Standards
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#64748b" }}>
                            <div style={{ background: "#0f172a", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "16px" }}>🔒</span>
                                <div>
                                    <strong style={{ color: "#e2e8f0", fontSize: "12px", display: "block" }}>256-Bit Encrypted</strong>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Bank-Grade Data Security</span>
                                </div>
                            </div>
                            <div style={{ background: "#0f172a", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "16px" }}>📐</span>
                                <div>
                                    <strong style={{ color: "#e2e8f0", fontSize: "12px", display: "block" }}>BNBC 2020 Compliant</strong>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Bangladesh Building Code</span>
                                </div>
                            </div>
                            <div style={{ background: "#0f172a", padding: "10px 14px", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "16px" }}>🟢</span>
                                <div>
                                    <strong style={{ color: "#10b981", fontSize: "12px", display: "block" }}>System Operational</strong>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>Dhaka Server East-1 (99.9% Uptime)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM LEGAL & COPYRIGHT BAR */}
                <div style={{
                    paddingTop: "28px",
                    borderTop: "1px solid #1e293b",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    fontSize: "13px",
                    color: "#64748b"
                }}>
                    <div>
                        © {new Date().getFullYear()} CPS Management System. All rights reserved. Registered Enterprise Operations Suite.
                    </div>

                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                        <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#cbd5e1"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Privacy Policy</span>
                        <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#cbd5e1"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Terms of Service</span>
                        <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#cbd5e1"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Security Standards</span>
                        <span style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#cbd5e1"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>ISO 9001:2015</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
