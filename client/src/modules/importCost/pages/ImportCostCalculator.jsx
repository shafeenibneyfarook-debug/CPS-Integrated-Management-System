import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";

export default function ImportCostCalculator() {
    const { user } = useAuth();
    const role = user?.role || "client";
    const isAccountsOfficer = role === "accounts_officer";
    const isSupplier = role === "supplier";
    const isManager = role === "manager" || role === "admin";
    const canApprove = role === "accounts_officer" || role === "admin";
    const canReceive = role === "operations_officer" || role === "staff" || role === "manager" || role === "admin" || isSupplier;
    const canUpdateStatus = isSupplier || isManager || role === "operations_officer" || role === "admin";

    const [rateInfo, setRateInfo] = useState(null);
    const [savedRecords, setSavedRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        title: "Steel & Equipment Import Batch #102",
        itemName: "Reinforced Steel Rod 16mm",
        category: "Steel & Rod",
        quantity: 50,
        unit: "Tons",
        warehouseLocation: "Central Depot",
        foreignCurrency: "USD",
        productCost: 25000,
        shippingCost: 3200,
        customsDuty: 4500,
        taxVAT: 2800,
        otherCharges: 800,
        expectedSellingValueBDT: 5200000,
        notes: "Import from Shandong Steel Corp"
    });

    const [result, setResult] = useState(null);

    // Supplier Status Update Modal State
    const [selectedStatusRecord, setSelectedStatusRecord] = useState(null);
    const [statusForm, setStatusForm] = useState({
        orderStatus: "Dispatched / In Transit",
        carrier: "",
        trackingNumber: "",
        estimatedArrival: "",
        supplierStatusNotes: ""
    });

    useEffect(() => {
        fetchRatesAndRecords();
    }, []);

    const fetchRatesAndRecords = async () => {
        setLoading(true);
        try {
            const [rateRes, recRes] = await Promise.all([
                API.get("/import-costs/rates").catch(() => ({ data: null })),
                API.get("/import-costs/records").catch(() => ({ data: { records: [] } }))
            ]);
            if (rateRes && rateRes.data) setRateInfo(rateRes.data);
            if (recRes && recRes.data) setSavedRecords(recRes.data.records || []);
        } catch (err) {
            console.error("Error fetching import rates:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async (saveRecord = false) => {
        try {
            const res = await API.post("/import-costs/calculate", {
                ...form,
                saveRecord
            });
            setResult(res.data);
            if (saveRecord) {
                alert("Import/Export requisition saved and submitted for Manager & Finance approval!");
                fetchRatesAndRecords();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Calculation error");
        }
    };

    const handleVerifyManager = async (recordId, status = "Manager Approved") => {
        try {
            const res = await API.put(`/import-costs/${recordId}/verify-manager`, { status });
            alert(res.data.message);
            fetchRatesAndRecords();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update manager approval");
        }
    };

    const handleVerifyFinance = async (recordId, status = "Finance Approved") => {
        try {
            const res = await API.put(`/import-costs/${recordId}/verify-finance`, { status });
            alert(res.data.message);
            fetchRatesAndRecords();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update import order status");
        }
    };

    const handleReceiveIntoInventory = async (recordId) => {
        try {
            const res = await API.put(`/import-costs/${recordId}/receive`);
            alert(res.data.message);
            fetchRatesAndRecords();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to receive import into inventory");
        }
    };

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStatusRecord) return;
        try {
            const res = await API.put(`/import-costs/${selectedStatusRecord._id}/status`, statusForm);
            alert(res.data.message);
            setSelectedStatusRecord(null);
            fetchRatesAndRecords();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update import order status");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <span style={{ fontSize: "32px" }}>⏳</span>
                <p style={{ marginTop: "10px", fontWeight: "700" }}>Loading Import & Export Orders Portal...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                    {isAccountsOfficer
                        ? "Unified Finance — Import & Export Duty Approval Engine"
                        : isSupplier
                        ? "Supplier Import / Export & Shipment Tracking Portal"
                        : "Import & Export Cost Calculator & Management"}
                </h1>
                <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                    {isAccountsOfficer
                        ? "Mandatory financial review and approval of import/export landed costs, customs duty charges, and currency exchange valuations."
                        : isSupplier
                        ? "Track international material shipments, manage customs clearance, and update logistics tracking for your import orders."
                        : "Calculate landed import/export cost, duty charges, profit/loss margins, and submit orders for Manager & Finance approval."}
                </p>
            </div>

            {/* CONDITIONAL: Role-tailored Views */}
            {isAccountsOfficer ? (
                /* Finance Role sees Dedicated Order Approval Notice */
                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "18px 22px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "28px" }}>🛡️</span>
                        <div>
                            <strong style={{ color: "#1e293b", fontSize: "16px" }}>Finance Approvals & Verification Portal Active</strong>
                            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>
                                Review landed costs and customs duties submitted by Managers, Logistics & Suppliers below. Click <strong>✓ Approve</strong> or <strong>✕ Reject</strong> to process import requests.
                            </div>
                        </div>
                    </div>
                    <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "13px" }}>
                        {savedRecords.filter(r => r.financeApprovalStatus === "Pending Finance Approval").length} Pending Requests
                    </div>
                </div>
            ) : isSupplier ? (
                /* Supplier Role sees Dedicated Tracking & Update Status Banner */
                <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "18px 22px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "28px" }}>🚢</span>
                        <div>
                            <strong style={{ color: "#581c87", fontSize: "16px" }}>Supplier Import Tracking & Dispatch Workspace</strong>
                            <div style={{ color: "#6b21a8", fontSize: "13px", marginTop: "2px" }}>
                                As an authorized importer/supplier, you can track international material shipments and click <strong>⚡ Update Status</strong> below to advance LC progress, customs clearance, and port deliveries.
                            </div>
                        </div>
                    </div>
                    <div style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", color: "#6b21a8", padding: "6px 14px", borderRadius: "8px", fontWeight: "800", fontSize: "13px" }}>
                        {savedRecords.length} Active Import Orders
                    </div>
                </div>
            ) : (
                /* Internal Managers, Logistics & Admins see Full Cost Calculation Tool */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                    {/* FORM INPUTS */}
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0", color: "#0f172a" }}>
                            Import / Export Requisition Parameters
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Shipment / Import Title:</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Item / Product Name:</label>
                                    <input
                                        type="text"
                                        value={form.itemName}
                                        onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Category:</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="Cement & Concrete">Cement & Concrete</option>
                                        <option value="Steel & Rod">Steel & Rod</option>
                                        <option value="Bricks & Blocks">Bricks & Blocks</option>
                                        <option value="Sand & Aggregate">Sand & Aggregate</option>
                                        <option value="Tiles & Plumbing">Tiles & Plumbing</option>
                                        <option value="Electrical & Fixtures">Electrical & Fixtures</option>
                                        <option value="Equipment & Tools">Equipment & Tools</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Quantity:</label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Unit:</label>
                                    <input
                                        type="text"
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Warehouse:</label>
                                    <input
                                        type="text"
                                        value={form.warehouseLocation}
                                        onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Foreign Currency:</label>
                                    <select
                                        value={form.foreignCurrency}
                                        onChange={(e) => setForm({ ...form, foreignCurrency: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="USD">USD ($) - US Dollar</option>
                                        <option value="EUR">EUR (€) - Euro</option>
                                        <option value="CNY">CNY (¥) - Chinese Yuan</option>
                                        <option value="GBP">GBP (£) - British Pound</option>
                                        <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Applied Rate (BDT):</label>
                                    <input
                                        disabled
                                        value={`1 ${form.foreignCurrency} = ${appliedRate} BDT`}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: "700" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Product FOB Cost ({form.foreignCurrency}):</label>
                                    <input
                                        type="number"
                                        value={form.productCost}
                                        onChange={(e) => setForm({ ...form, productCost: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Freight & Shipping ({form.foreignCurrency}):</label>
                                    <input
                                        type="number"
                                        value={form.shippingCost}
                                        onChange={(e) => setForm({ ...form, shippingCost: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Customs / Duty Charges ({form.foreignCurrency}):</label>
                                    <input
                                        type="number"
                                        value={form.customsDuty}
                                        onChange={(e) => setForm({ ...form, customsDuty: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Tax / VAT ({form.foreignCurrency}):</label>
                                    <input
                                        type="number"
                                        value={form.taxVAT}
                                        onChange={(e) => setForm({ ...form, taxVAT: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Expected Selling / Contract Value (BDT):</label>
                                <input
                                    type="number"
                                    value={form.expectedSellingValueBDT}
                                    onChange={(e) => setForm({ ...form, expectedSellingValueBDT: Number(e.target.value) })}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => handleCalculate(false)}
                                    style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Calculate Cost & Profit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCalculate(true)}
                                    style={{ flex: 1, padding: "10px", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Save & Submit to Manager
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CALCULATION RESULTS PANEL */}
                    <div>
                        {result ? (
                            <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <h2 style={{ fontSize: "18px", fontWeight: "800", margin: 0, color: "#0f172a" }}>Landed Cost Summary</h2>
                                    <span style={{
                                        padding: "4px 12px",
                                        borderRadius: "999px",
                                        fontSize: "12px",
                                        fontWeight: "800",
                                        background: result.isProfitable ? "#dcfce7" : "#ffe4e6",
                                        color: result.isProfitable ? "#15803d" : "#be123c"
                                    }}>
                                        {result.isProfitable ? `PROFITABLE (+${result.profitMarginPercent}%)` : `LOSS (${result.profitMarginPercent}%)`}
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                        <span>Product Cost:</span>
                                        <strong>BDT {result.breakdownBDT.productCostBDT.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                        <span>Shipping & Freight:</span>
                                        <strong>BDT {result.breakdownBDT.shippingCostBDT.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                        <span>Customs Duty & Clearance:</span>
                                        <strong>BDT {result.breakdownBDT.customsDutyBDT.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                                        <span>Tax & VAT:</span>
                                        <strong>BDT {result.breakdownBDT.taxVATBDT.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                                        <strong style={{ fontSize: "15px" }}>TOTAL LANDED IMPORT COST:</strong>
                                        <strong style={{ fontSize: "16px", color: "#1e293b" }}>BDT {result.totalImportCostBDT.toLocaleString()}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                                        <span>Expected Contract Value:</span>
                                        <strong>BDT {result.expectedSellingValueBDT.toLocaleString()}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", background: result.isProfitable ? "#f0fdf4" : "#fff1f2", padding: "12px", borderRadius: "8px", border: `1px solid ${result.isProfitable ? "#bbf7d0" : "#fecdd3"}` }}>
                                        <strong style={{ color: result.isProfitable ? "#166534" : "#9f1239" }}>ESTIMATED NET PROFIT / LOSS:</strong>
                                        <strong style={{ fontSize: "18px", color: result.isProfitable ? "#15803d" : "#be123c" }}>BDT {result.estimatedProfitBDT.toLocaleString()}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: "#fff", padding: "48px 24px", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b" }}>
                                <span style={{ fontSize: "36px" }}>📊</span>
                                <h3 style={{ margin: "12px 0 4px 0", color: "#334155" }}>Calculation Preview</h3>
                                <p style={{ margin: 0, fontSize: "13px" }}>Enter import cost parameters and click "Calculate Cost & Profit" to view landed breakdown.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SAVED RECORDS AUDIT TRAIL & APPROVALS */}
            <div style={{ marginTop: "32px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>Import & Export Requisitions, Approvals & Receipts</h3>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead style={{ background: "#f8fafc", color: "#475569" }}>
                        <tr>
                            <th style={{ padding: "10px 14px" }}>Requisition / Item</th>
                            <th style={{ padding: "10px 14px" }}>Quantity</th>
                            <th style={{ padding: "10px 14px" }}>Currency / Rate</th>
                            <th style={{ padding: "10px 14px" }}>Total Cost (BDT)</th>
                            <th style={{ padding: "10px 14px" }}>Manager Approval</th>
                            <th style={{ padding: "10px 14px" }}>Finance Approval</th>
                            <th style={{ padding: "10px 14px" }}>Import & Customs Tracking</th>
                            <th style={{ padding: "10px 14px" }}>Receipt</th>
                            <th style={{ padding: "10px 14px", textAlign: "center" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {savedRecords.map(r => {
                            const isManagerApproved = r.managerApprovalStatus === "Manager Approved";
                            const isFinanceApproved = r.financeApprovalStatus === "Finance Approved";
                            const isReceived = r.receivingStatus === "Received";

                            const getStatusBadgeColor = (st) => {
                                switch (st) {
                                    case "LC Opened": return { bg: "#eff6ff", text: "#1d4ed8" };
                                    case "In Production / Packed": return { bg: "#f5f3ff", text: "#7c3aed" };
                                    case "Dispatched / In Transit": return { bg: "#fef3c7", text: "#b45309" };
                                    case "Customs Clearance": return { bg: "#ffedd5", text: "#c2410c" };
                                    case "Arrived at Port / Warehouse": return { bg: "#dcfce7", text: "#15803d" };
                                    case "Delivered": return { bg: "#d1fae5", text: "#065f46" };
                                    case "Successfully Closed":
                                    case "Closed / Received by Logistics":
                                        return { bg: "#ecfdf5", text: "#065f46" };
                                    case "Cancelled": return { bg: "#fee2e2", text: "#991b1b" };
                                    default: return { bg: "#f1f5f9", text: "#475569" };
                                }
                            };

                            const badgeStyle = getStatusBadgeColor(r.orderStatus);

                            return (
                                <tr key={r._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "10px 14px", fontWeight: "700" }}>
                                        <div>{r.title}</div>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{r.itemName || "Material"} · {r.category}</div>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontWeight: "700" }}>
                                        {r.quantity} {r.unit}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        {r.foreignCurrency} ({r.exchangeRate}) {r.isFallbackRate && <span style={{ fontSize: "10px", color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>Fallback</span>}
                                    </td>
                                    <td style={{ padding: "10px 14px", fontWeight: "700" }}>BDT {r.totalImportCostBDT?.toLocaleString()}</td>

                                    {/* Manager Approval Status */}
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            background: isManagerApproved ? "#dcfce7" : r.managerApprovalStatus === "Manager Rejected" ? "#fef2f2" : "#fffbeb",
                                            color: isManagerApproved ? "#15803d" : r.managerApprovalStatus === "Manager Rejected" ? "#991b1b" : "#b45309"
                                        }}>
                                            {r.managerApprovalStatus || "Pending Manager Approval"}
                                        </span>
                                    </td>

                                    {/* Finance Approval Status */}
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            background: isFinanceApproved ? "#dcfce7" : r.financeApprovalStatus === "Finance Rejected" ? "#fef2f2" : "#fffbeb",
                                            color: isFinanceApproved ? "#15803d" : r.financeApprovalStatus === "Finance Rejected" ? "#991b1b" : "#b45309"
                                        }}>
                                            {r.financeApprovalStatus || "Pending Finance Approval"}
                                        </span>
                                    </td>

                                    {/* Import & Customs Status */}
                                    <td style={{ padding: "10px 14px" }}>
                                        <div>
                                            <span style={{
                                                padding: "3px 8px",
                                                borderRadius: "999px",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                background: badgeStyle.bg,
                                                color: badgeStyle.text
                                            }}>
                                                {r.orderStatus || "Requisition Created"}
                                            </span>
                                            {r.carrier && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Carrier: {r.carrier}</div>}
                                            {r.trackingNumber && <div style={{ fontSize: "11px", color: "#0284c7" }}>Track #: {r.trackingNumber}</div>}
                                            {r.supplierName && <div style={{ fontSize: "10px", color: "#7c3aed" }}>🚢 Importer: {r.supplierName}</div>}
                                        </div>
                                    </td>

                                    {/* Receiving Status */}
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            background: isReceived ? "#dcfce7" : "#f1f5f9",
                                            color: isReceived ? "#15803d" : "#64748b"
                                        }}>
                                            {isReceived ? "✅ Received & Closed" : "Not Received"}
                                        </span>
                                    </td>

                                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                                            {/* Supplier / Importer Update Status Button */}
                                            {canUpdateStatus && !isReceived && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStatusRecord(r);
                                                        setStatusForm({
                                                             orderStatus: r.orderStatus || "Dispatched / In Transit",
                                                            carrier: r.carrier || "",
                                                            trackingNumber: r.trackingNumber || "",
                                                            estimatedArrival: r.estimatedArrival ? r.estimatedArrival.split("T")[0] : "",
                                                            supplierStatusNotes: r.supplierStatusNotes || ""
                                                        });
                                                    }}
                                                    style={{ padding: "4px 8px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}
                                                >
                                                    <span>⚡</span> Update Status
                                                </button>
                                            )}

                                            {/* Manager Action */}
                                            {isManager && !isManagerApproved && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleVerifyManager(r._id, "Manager Approved")}
                                                    style={{ padding: "4px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                                >
                                                    ✓ Manager Approve
                                                </button>
                                            )}

                                            {/* Finance Action */}
                                            {canApprove && !isFinanceApproved && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerifyFinance(r._id, "Finance Approved")}
                                                        style={{ padding: "4px 8px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                                                    >
                                                        ✓ Finance Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerifyFinance(r._id, "Finance Rejected")}
                                                        style={{ padding: "4px 8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </>
                                            )}

                                            {/* Receiving Action for Logistics */}
                                            {canReceive && isFinanceApproved && !isReceived && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReceiveIntoInventory(r._id)}
                                                    style={{ padding: "4px 8px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                                                >
                                                    📦 Receive & Close Import
                                                </button>
                                            )}

                                            {/* Successfully Closed Indicator */}
                                            {isReceived && (
                                                <span style={{ fontSize: "11px", color: "#059669", fontWeight: "800", background: "#ecfdf5", padding: "3px 8px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                                                    🔒 Successfully Closed
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {savedRecords.length === 0 && (
                            <tr>
                                <td colSpan="9" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                                    No saved import/export cost audit records.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* SUPPLIER IMPORT ORDER STATUS & TRACKING UPDATE MODAL */}
            {selectedStatusRecord && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#ffffff", width: "480px", maxWidth: "92vw", borderRadius: "14px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Update Import / Export Order Status</h2>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 16px 0" }}>
                            Requisition: <strong style={{ color: "#0f172a" }}>{selectedStatusRecord.title}</strong> ({selectedStatusRecord.itemName || "Material"})
                        </p>

                        <form onSubmit={handleUpdateStatusSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Shipping / Customs Status *</label>
                                <select
                                    value={statusForm.orderStatus}
                                    onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "700", marginTop: "4px" }}
                                >
                                    <option value="LC Opened">📄 LC Opened (Letter of Credit Issued)</option>
                                    <option value="In Production / Packed">📦 In Production / Packed at Factory</option>
                                    <option value="Dispatched / In Transit">🚢 Dispatched / In Transit (Sea / Air / Land)</option>
                                    <option value="Customs Clearance">🛃 Customs Clearance in Progress</option>
                                    <option value="Arrived at Port / Warehouse">⚓ Arrived at Port / Central Warehouse</option>
                                    <option value="Delivered">✅ Delivered (Ready for Inventory Stocking)</option>
                                    <option value="Successfully Closed">🔒 Successfully Closed (Received by Logistics)</option>
                                    <option value="Cancelled">❌ Order Cancelled</option>
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Shipping Carrier:</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Maersk / MSC / DHL"
                                        value={statusForm.carrier}
                                        onChange={(e) => setStatusForm({ ...statusForm, carrier: e.target.value })}
                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>BL / Tracking Number:</label>
                                    <input
                                        type="text"
                                        placeholder="Container / Waybill #"
                                        value={statusForm.trackingNumber}
                                        onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Estimated Arrival Date (ETA):</label>
                                <input
                                    type="date"
                                    value={statusForm.estimatedArrival}
                                    onChange={(e) => setStatusForm({ ...statusForm, estimatedArrival: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Supplier / Port Clearance Notes:</label>
                                <textarea
                                    placeholder="Port terminal details, customs duty payment remarks, container breakdown..."
                                    value={statusForm.supplierStatusNotes}
                                    onChange={(e) => setStatusForm({ ...statusForm, supplierStatusNotes: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "65px", marginTop: "4px" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: "10px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                                >
                                    💾 Save Status & Tracking
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedStatusRecord(null)}
                                    style={{ padding: "10px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "700", color: "#475569" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

