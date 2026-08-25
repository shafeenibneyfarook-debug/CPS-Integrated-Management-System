import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";

export default function ProductRecommendationList() {
    const [targetBudget, setTargetBudget] = useState(500000);
    const [category, setCategory] = useState("All");
    const [catalog, setCatalog] = useState([]);
    const [packages, setPackages] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Modal
    const [showSubModal, setShowSubModal] = useState(false);
    const [alertForm, setAlertForm] = useState({
        materialName: "Akij PCC Cement",
        category: "Cement",
        targetMaxPriceBDT: 540
    });

    useEffect(() => {
        fetchRecommendations();
        fetchAlerts();
    }, [category]);

    const fetchRecommendations = async () => {
        try {
            const res = await API.get(`/product-recommendations/recommendations?targetBudgetBDT=${targetBudget}&category=${category}`);
            setCatalog(res.data.catalogComparison || []);
            setPackages(res.data.recommendedPackages || []);
        } catch (err) {
            console.error("Error fetching product recommendations:", err);
        }
    };

    const fetchAlerts = async () => {
        try {
            const res = await API.get("/product-recommendations/alerts");
            setAlerts(res.data.alerts || []);
        } catch (err) {
            console.error("Error fetching price alerts:", err);
        }
    };

    const handleCreateAlert = async (e) => {
        e.preventDefault();
        try {
            await API.post("/product-recommendations/alerts", alertForm);
            setShowSubModal(false);
            fetchAlerts();
            alert("Price alert subscription registered!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create alert");
        }
    };

    const triggeredAlerts = alerts.filter(a => a.status === "Triggered");

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        Budget-Based Product Recommendations & Price Alerts
                    </h1>
                    <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                        Compare construction materials by brand, price, supplier, quality, and receive alerts when material prices match your planned budget.
                    </p>
                </div>
                <button
                    onClick={() => setShowSubModal(true)}
                    style={{
                        padding: "10px 18px",
                        backgroundColor: "#a855f7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <span>🔔</span> Create Price Alert Subscription
                </button>
            </div>

            {/* Price Alert Triggers Banner */}
            {triggeredAlerts.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🎉</span>
                        <div>
                            <strong style={{ color: "#166534", fontSize: "15px" }}>Material Price Drop Alerts Triggered! ({triggeredAlerts.length})</strong>
                            {triggeredAlerts.map(a => (
                                <div key={a._id} style={{ fontSize: "13px", color: "#15803d", marginTop: "2px" }}>
                                    • {a.alertMessage}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Target Budget Filter Bar */}
            <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "28px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Target Client Budget (BDT):</label>
                    <input
                        type="number"
                        step="10000"
                        value={targetBudget}
                        onChange={(e) => setTargetBudget(Number(e.target.value))}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700", fontSize: "16px", marginTop: "4px" }}
                    />
                </div>

                <div style={{ width: "200px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Category Filter:</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                    >
                        <option value="All">All Material Categories</option>
                        <option value="Cement">Cement</option>
                        <option value="Rod/Steel">Rod / Steel</option>
                        <option value="Bricks">Bricks</option>
                    </select>
                </div>

                <div style={{ alignSelf: "flex-end" }}>
                    <button
                        onClick={fetchRecommendations}
                        style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                    >
                        Find Recommended Packages
                    </button>
                </div>
            </div>

            {/* RECOMMENDED PACKAGES CARDS */}
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
                Budget-Matched Recommended Material Packages
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "36px" }}>
                {packages.map(pkg => (
                    <div key={pkg.packageId} style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: `2px solid ${pkg.isWithinBudget ? "#10b981" : "#f59e0b"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>{pkg.packageName}</h3>
                            <span style={{
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "11px",
                                fontWeight: "800",
                                background: pkg.isWithinBudget ? "#dcfce7" : "#fef3c7",
                                color: pkg.isWithinBudget ? "#15803d" : "#b45309"
                            }}>
                                {pkg.statusBadge}
                            </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Tier: {pkg.qualityCategory}</div>

                        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>TOTAL PACKAGE ESTIMATE</div>
                            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>BDT {pkg.totalPackageCostBDT.toLocaleString()}</div>
                        </div>

                        <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#475569" }}>Included Recommended Products:</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                            {pkg.itemBreakdown.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
                                    <span>• {item.name} ({item.brand}) x {item.quantity} {item.unit}</span>
                                    <strong>BDT {(item.unitPriceBDT * item.quantity).toLocaleString()}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* PRODUCT COMPARISON MATRIX TABLE */}
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
                Material Brand & Supplier Comparison Matrix
            </h2>
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                        <tr>
                            <th style={{ padding: "14px 16px" }}>Product Name</th>
                            <th style={{ padding: "14px 16px" }}>Category</th>
                            <th style={{ padding: "14px 16px" }}>Brand</th>
                            <th style={{ padding: "14px 16px" }}>Supplier</th>
                            <th style={{ padding: "14px 16px" }}>Unit Price (BDT)</th>
                            <th style={{ padding: "14px 16px" }}>Quality Grade</th>
                            <th style={{ padding: "14px 16px" }}>Availability</th>
                        </tr>
                    </thead>
                    <tbody>
                        {catalog.map(prod => (
                            <tr key={prod.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>{prod.name}</td>
                                <td style={{ padding: "14px 16px" }}>{prod.category}</td>
                                <td style={{ padding: "14px 16px", fontWeight: "600", color: "#2563eb" }}>{prod.brand}</td>
                                <td style={{ padding: "14px 16px" }}>{prod.supplier}</td>
                                <td style={{ padding: "14px 16px", fontWeight: "800", fontSize: "15px" }}>
                                    BDT {prod.unitPriceBDT.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>/ {prod.unit}</span>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", background: "#f1f5f9" }}>
                                        {prod.qualityCategory}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 16px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#15803d" }}>✓ {prod.availability}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE PRICE ALERT MODAL */}
            {showSubModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "450px", borderRadius: "12px", padding: "24px" }}>
                        <h2 style={{ marginTop: 0, fontSize: "18px", color: "#0f172a" }}>Subscribe to Price Drop Alert</h2>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>Receive automated notifications when material prices fall within your budget threshold.</p>

                        <form onSubmit={handleCreateAlert} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Material / Brand Name:</label>
                                <input
                                    type="text"
                                    required
                                    value={alertForm.materialName}
                                    onChange={(e) => setAlertForm({ ...alertForm, materialName: e.target.value })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Category:</label>
                                <select
                                    value={alertForm.category}
                                    onChange={(e) => setAlertForm({ ...alertForm, category: e.target.value })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="Cement">Cement</option>
                                    <option value="Rod/Steel">Rod / Steel</option>
                                    <option value="Bricks">Bricks</option>
                                    <option value="Sand & Aggregate">Sand & Aggregate</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Target Maximum Price (BDT):</label>
                                <input
                                    type="number"
                                    required
                                    value={alertForm.targetMaxPriceBDT}
                                    onChange={(e) => setAlertForm({ ...alertForm, targetMaxPriceBDT: Number(e.target.value) })}
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowSubModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#a855f7", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Subscribe Alert</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
