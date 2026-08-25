import React, { useState, useEffect } from "react";
import API from "../../../api/axiosConfig";
import { useAuth } from "../../auth/authStore";

export default function InventoryList() {
    const { user } = useAuth();
    const role = user?.role;
    const isLogistics = role === "operations_officer" || role === "staff" || role === "admin";
    const isManager = role === "manager" || role === "admin";
    const isFinance = role === "accounts_officer" || role === "admin";
    const canReceive = isLogistics || isManager || role === "supplier";

    const [items, setItems] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [requisitions, setRequisitions] = useState([]);
    const [ratesInfo, setRatesInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("items"); // "items" | "movements" | "requisitions"

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [showRequisitionModal, setShowRequisitionModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        itemName: "",
        category: "Cement & Concrete",
        unit: "Bags",
        currentStock: 100,
        minStockLevel: 20,
        unitPrice: 550,
        warehouseLocation: "Central Depot"
    });

    const [movementForm, setMovementForm] = useState({
        movementType: "Stock-Out",
        quantity: "",
        referenceNote: ""
    });

    const [reqForm, setReqForm] = useState({
        title: "Product Requisition Batch #101",
        itemName: "Portland Composite Cement",
        category: "Cement & Concrete",
        quantity: 200,
        unit: "Bags",
        warehouseLocation: "Central Depot",
        foreignCurrency: "USD",
        productCost: 2000,
        shippingCost: 300,
        customsDuty: 400,
        taxVAT: 250,
        otherCharges: 50,
        expectedSellingValueBDT: 350000,
        notes: "Requisition for ongoing project supply"
    });

    const [reqPreview, setReqPreview] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        fetchData();
        fetchRatesAndRequisitions();
    }, [categoryFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, alertsRes, movementsRes] = await Promise.all([
                API.get(`/inventory?category=${categoryFilter}`),
                API.get("/inventory/alerts"),
                API.get("/inventory/movements")
            ]);
            setItems(itemsRes.data.items || []);
            setAlerts(alertsRes.data.alerts || []);
            setMovements(movementsRes.data.movements || []);
        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRatesAndRequisitions = async () => {
        try {
            const [rateRes, recRes] = await Promise.all([
                API.get("/import-costs/rates"),
                API.get("/import-costs/records")
            ]);
            setRatesInfo(rateRes.data);
            setRequisitions(recRes.data.records || []);
        } catch (err) {
            console.error("Error fetching requisitions:", err);
        }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            await API.post("/inventory", createForm);
            setShowCreateModal(false);
            setCreateForm({ itemName: "", category: "Cement & Concrete", unit: "Bags", currentStock: 100, minStockLevel: 20, unitPrice: 550, warehouseLocation: "Central Depot" });
            fetchData();
            alert("Inventory item added successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add inventory item");
        }
    };

    const handleRecordMovement = async (e) => {
        e.preventDefault();
        if (!selectedItem) return;
        setErrorMessage("");
        try {
            const res = await API.post("/inventory/movements", {
                itemId: selectedItem._id,
                ...movementForm
            });
            setShowMovementModal(false);
            setMovementForm({ movementType: "Stock-Out", quantity: "", referenceNote: "" });
            fetchData();
            alert(res.data.message || "Stock movement recorded!");
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Failed to record movement");
        }
    };

    const handleCalculateRequisition = async (saveRecord = false) => {
        try {
            const res = await API.post("/import-costs/calculate", {
                ...reqForm,
                saveRecord
            });
            setReqPreview(res.data);
            if (saveRecord) {
                alert("🎉 Product Requisition submitted successfully! Routed to Manager for review & approval.");
                setShowRequisitionModal(false);
                fetchRatesAndRequisitions();
                setActiveTab("requisitions");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Calculation error");
        }
    };

    const handleVerifyManager = async (recordId, status = "Manager Approved") => {
        try {
            const res = await API.put(`/import-costs/${recordId}/verify-manager`, { status });
            alert(res.data.message);
            fetchRatesAndRequisitions();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update manager approval");
        }
    };

    const handleVerifyFinance = async (recordId, status = "Finance Approved") => {
        try {
            const res = await API.put(`/import-costs/${recordId}/verify-finance`, { status });
            alert(res.data.message);
            fetchRatesAndRequisitions();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update finance approval");
        }
    };

    const handleReceiveIntoInventory = async (recordId) => {
        try {
            const res = await API.put(`/import-costs/${recordId}/receive`);
            alert(res.data.message);
            fetchData();
            fetchRatesAndRequisitions();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to receive import into inventory");
        }
    };

    const filteredItems = items.filter(i =>
        i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const appliedRate = ratesInfo?.rates?.[reqForm.foreignCurrency] || 1.0;

    return (
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                        Inventory & Stock Management
                    </h1>
                    <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                        Real-time stock levels, movement audits, logistics product requisitions, and sequential multi-tier approvals.
                    </p>
                </div>
                {isLogistics && role !== "supplier" && (
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={() => { setShowRequisitionModal(true); setReqPreview(null); }}
                            style={{
                                padding: "10px 18px",
                                backgroundColor: "#059669",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <span>📦</span> Request Product / Requisition
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: "10px 18px",
                                backgroundColor: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            + Add Inventory Item
                        </button>
                    </div>
                )}
            </div>

            {alerts.length > 0 && (
                <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>⚠️</span>
                        <div>
                            <strong style={{ color: "#be123c", fontSize: "15px" }}>Low Stock Alert: {alerts.length} Item(s) Below Minimum Threshold</strong>
                            <div style={{ fontSize: "13px", color: "#9f1239" }}>
                                {alerts.map(a => `${a.itemName} (${a.currentStock} ${a.unit})`).join(", ")}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                <button
                    onClick={() => setActiveTab("items")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        fontWeight: "700",
                        fontSize: "15px",
                        color: activeTab === "items" ? "#2563eb" : "#64748b",
                        borderBottom: activeTab === "items" ? "3px solid #2563eb" : "none",
                        cursor: "pointer"
                    }}
                >
                    Stock Catalog ({items.length})
                </button>
                <button
                    onClick={() => setActiveTab("movements")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        fontWeight: "700",
                        fontSize: "15px",
                        color: activeTab === "movements" ? "#2563eb" : "#64748b",
                        borderBottom: activeTab === "movements" ? "3px solid #2563eb" : "none",
                        cursor: "pointer"
                    }}
                >
                    Movement History Log ({movements.length})
                </button>
                {role !== "supplier" && (
                    <button
                        onClick={() => setActiveTab("requisitions")}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            background: "none",
                            fontWeight: "700",
                            fontSize: "15px",
                            color: activeTab === "requisitions" ? "#2563eb" : "#64748b",
                            borderBottom: activeTab === "requisitions" ? "3px solid #2563eb" : "none",
                            cursor: "pointer"
                        }}
                    >
                        Product & Import Requisitions ({requisitions.length})
                    </button>
                )}
            </div>

            {activeTab === "items" && (
                <div>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                        <input
                            type="text"
                            placeholder="Search by item code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "280px" }}
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                            <option value="">All Categories</option>
                            <option value="Cement & Concrete">Cement & Concrete</option>
                            <option value="Steel & Rod">Steel & Rod</option>
                            <option value="Bricks & Blocks">Bricks & Blocks</option>
                            <option value="Sand & Aggregate">Sand & Aggregate</option>
                            <option value="Tiles & Plumbing">Tiles & Plumbing</option>
                        </select>
                    </div>

                    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <tr>
                                    <th style={{ padding: "14px 16px" }}>Code</th>
                                    <th style={{ padding: "14px 16px" }}>Item Name</th>
                                    <th style={{ padding: "14px 16px" }}>Category</th>
                                    <th style={{ padding: "14px 16px" }}>Current Stock</th>
                                    <th style={{ padding: "14px 16px" }}>Min Threshold</th>
                                    <th style={{ padding: "14px 16px" }}>Unit Price</th>
                                    <th style={{ padding: "14px 16px" }}>Status</th>
                                    <th style={{ padding: "14px 16px" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "14px 16px", fontWeight: "700", color: "#64748b" }}>{item.itemCode}</td>
                                        <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0f172a" }}>{item.itemName}</td>
                                        <td style={{ padding: "14px 16px" }}>{item.category}</td>
                                        <td style={{ padding: "14px 16px", fontWeight: "800", fontSize: "15px" }}>{item.currentStock} {item.unit}</td>
                                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{item.minStockLevel} {item.unit}</td>
                                        <td style={{ padding: "14px 16px" }}>BDT {item.unitPrice}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: item.status === "In Stock" ? "#dcfce7" : item.status === "Low Stock" ? "#fef3c7" : "#ffe4e6", color: item.status === "In Stock" ? "#15803d" : item.status === "Low Stock" ? "#b45309" : "#be123c" }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            {role === "supplier" || item.currentStock === 0 ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setMovementForm({ movementType: "Stock-In", quantity: "", referenceNote: role === "supplier" ? `Supplier Delivery - ${user?.name || "Vendor"}` : "Warehouse Restock" });
                                                        setShowMovementModal(true);
                                                        setErrorMessage("");
                                                    }}
                                                    style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                >
                                                    <span>➕</span> Supply Stock
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setMovementForm({ movementType: "Stock-Out", quantity: "", referenceNote: "" });
                                                        setShowMovementModal(true);
                                                        setErrorMessage("");
                                                    }}
                                                    style={{ padding: "6px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                                                >
                                                    Record Movement
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "movements" && (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead style={{ background: "#f8fafc", color: "#475569" }}>
                            <tr>
                                <th style={{ padding: "12px 16px" }}>Item Name</th>
                                <th style={{ padding: "12px 16px" }}>Type</th>
                                <th style={{ padding: "12px 16px" }}>Quantity</th>
                                <th style={{ padding: "12px 16px" }}>Previous &rarr; New Stock</th>
                                <th style={{ padding: "12px 16px" }}>Notes</th>
                                <th style={{ padding: "12px 16px" }}>Recorded By</th>
                                <th style={{ padding: "12px 16px" }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => (
                                <tr key={m._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "12px 16px", fontWeight: "700" }}>{m.inventoryItem?.itemName}</td>
                                    <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", background: m.movementType === "Stock-In" || m.movementType === "Returned" ? "#dcfce7" : "#ffe4e6", color: m.movementType === "Stock-In" || m.movementType === "Returned" ? "#15803d" : "#be123c" }}>{m.movementType}</span></td>
                                    <td style={{ padding: "12px 16px", fontWeight: "700" }}>{m.quantity} {m.inventoryItem?.unit}</td>
                                    <td style={{ padding: "12px 16px" }}>{m.previousStock} → <strong>{m.newStock}</strong></td>
                                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{m.referenceNote || "N/A"}</td>
                                    <td style={{ padding: "12px 16px" }}>{m.performedBy?.name}</td>
                                    <td style={{ padding: "12px 16px" }}>{new Date(m.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "requisitions" && (
                <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead style={{ background: "#f8fafc", color: "#475569" }}>
                            <tr>
                                <th style={{ padding: "12px 16px" }}>Requisition / Product</th>
                                <th style={{ padding: "12px 16px" }}>Quantity</th>
                                <th style={{ padding: "12px 16px" }}>Landed Cost (BDT)</th>
                                <th style={{ padding: "12px 16px" }}>Manager Status</th>
                                <th style={{ padding: "12px 16px" }}>Finance Status</th>
                                <th style={{ padding: "12px 16px" }}>Stock Status</th>
                                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisitions.map((r) => {
                                const isManagerApproved = r.managerApprovalStatus === "Manager Approved";
                                const isFinanceApproved = r.financeApprovalStatus === "Finance Approved";
                                const isReceived = r.receivingStatus === "Received";
                                return (
                                    <tr key={r._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "12px 16px", fontWeight: "700" }}>
                                            <div>{r.title}</div>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>{r.itemName || "Material"} · {r.category} ({r.warehouseLocation})</div>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontWeight: "700" }}>{r.quantity} {r.unit}</td>
                                        <td style={{ padding: "12px 16px", fontWeight: "700" }}>BDT {r.totalImportCostBDT?.toLocaleString()}<div style={{ fontSize: "11px", color: "#64748b" }}>{r.foreignCurrency} {r.productCost}</div></td>
                                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", background: isManagerApproved ? "#dcfce7" : r.managerApprovalStatus === "Manager Rejected" ? "#fef2f2" : "#fffbeb", color: isManagerApproved ? "#15803d" : r.managerApprovalStatus === "Manager Rejected" ? "#991b1b" : "#b45309" }}>{r.managerApprovalStatus || "Pending Manager Approval"}</span></td>
                                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", background: isFinanceApproved ? "#dcfce7" : r.financeApprovalStatus === "Finance Rejected" ? "#fef2f2" : "#fffbeb", color: isFinanceApproved ? "#15803d" : r.financeApprovalStatus === "Finance Rejected" ? "#991b1b" : "#b45309" }}>{r.financeApprovalStatus || "Pending Finance Approval"}</span></td>
                                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", background: isReceived ? "#dcfce7" : "#f1f5f9", color: isReceived ? "#15803d" : "#64748b" }}>{isReceived ? "✅ In Stock" : "Not Received"}</span></td>
                                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                                                {isManager && !isManagerApproved && <button type="button" onClick={() => handleVerifyManager(r._id, "Manager Approved")} style={{ padding: "4px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>✓ Manager Approve</button>}
                                                {isFinance && !isFinanceApproved && <button type="button" onClick={() => handleVerifyFinance(r._id, "Finance Approved")} style={{ padding: "4px 8px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>✓ Finance Approve</button>}
                                                {canReceive && isFinanceApproved && !isReceived && <button type="button" onClick={() => handleReceiveIntoInventory(r._id)} style={{ padding: "5px 10px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>📦 Receive into Stock</button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {requisitions.length === 0 && <tr><td colSpan="7" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No product or import requisitions found. Click "Request Product / Requisition" to create one.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showRequisitionModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, overflowY: "auto", padding: "20px" }}>
                    <div style={{ background: "#fff", width: "700px", maxWidth: "95vw", borderRadius: "14px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Logistics Product & Import Requisition</h2>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Request materials for supply. Automatically routes through Manager &rarr; Finance &rarr; Auto-Stock Receipt.</p>
                            </div>
                            <button onClick={() => setShowRequisitionModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleCalculateRequisition(true); }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Requisition Title:</label>
                                <input required type="text" value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Item / Product Name:</label>
                                    <input required type="text" value={reqForm.itemName} onChange={(e) => setReqForm({ ...reqForm, itemName: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Category:</label>
                                    <select value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
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
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Quantity:</label>
                                    <input required type="number" min="1" value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Unit:</label>
                                    <input required type="text" value={reqForm.unit} onChange={(e) => setReqForm({ ...reqForm, unit: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Warehouse Location:</label>
                                    <input type="text" value={reqForm.warehouseLocation} onChange={(e) => setReqForm({ ...reqForm, warehouseLocation: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Currency:</label>
                                    <select value={reqForm.foreignCurrency} onChange={(e) => setReqForm({ ...reqForm, foreignCurrency: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                        <option value="USD">USD ($) - US Dollar</option>
                                        <option value="EUR">EUR (€) - Euro</option>
                                        <option value="CNY">CNY (¥) - Chinese Yuan</option>
                                        <option value="GBP">GBP (£) - British Pound</option>
                                        <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Applied Rate:</label>
                                    <input disabled value={`1 ${reqForm.foreignCurrency} = ${appliedRate} BDT`} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: "700" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>FOB Product Cost ({reqForm.foreignCurrency}):</label>
                                    <input type="number" value={reqForm.productCost} onChange={(e) => setReqForm({ ...reqForm, productCost: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Shipping & Freight ({reqForm.foreignCurrency}):</label>
                                    <input type="number" value={reqForm.shippingCost} onChange={(e) => setReqForm({ ...reqForm, shippingCost: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Customs / Duty ({reqForm.foreignCurrency}):</label>
                                    <input type="number" value={reqForm.customsDuty} onChange={(e) => setReqForm({ ...reqForm, customsDuty: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Tax / VAT ({reqForm.foreignCurrency}):</label>
                                    <input type="number" value={reqForm.taxVAT} onChange={(e) => setReqForm({ ...reqForm, taxVAT: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Expected Selling / Contract Value (BDT):</label>
                                <input type="number" value={reqForm.expectedSellingValueBDT} onChange={(e) => setReqForm({ ...reqForm, expectedSellingValueBDT: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }} />
                            </div>
                            {reqPreview && (
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Landed Cost:</span><strong>BDT {reqPreview.totalImportCostBDT?.toLocaleString()}</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}><span>Estimated Margin:</span><strong style={{ color: "#15803d" }}>+{reqPreview.profitMarginPercent}% (BDT {reqPreview.estimatedProfitBDT?.toLocaleString()})</strong></div>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button type="button" onClick={() => handleCalculateRequisition(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: "600" }}>Preview Breakdown</button>
                                <button type="button" onClick={() => setShowRequisitionModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#059669", color: "#fff", fontWeight: "700", cursor: "pointer" }}>🚀 Submit Requisition</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "480px", borderRadius: "12px", padding: "24px" }}>
                        <h2 style={{ marginTop: 0, fontSize: "20px", color: "#0f172a" }}>Add Inventory Item</h2>
                        <form onSubmit={handleCreateItem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Item Name:</label>
                                <input required type="text" value={createForm.itemName} onChange={(e) => setCreateForm({ ...createForm, itemName: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Category:</label>
                                <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                    <option value="Cement & Concrete">Cement & Concrete</option>
                                    <option value="Steel & Rod">Steel & Rod</option>
                                    <option value="Bricks & Blocks">Bricks & Blocks</option>
                                    <option value="Sand & Aggregate">Sand & Aggregate</option>
                                    <option value="Tiles & Plumbing">Tiles & Plumbing</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Initial Stock:</label>
                                    <input required type="number" value={createForm.currentStock} onChange={(e) => setCreateForm({ ...createForm, currentStock: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Unit:</label>
                                    <input required type="text" value={createForm.unit} onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Min Threshold:</label>
                                    <input required type="number" value={createForm.minStockLevel} onChange={(e) => setCreateForm({ ...createForm, minStockLevel: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Unit Price (BDT):</label>
                                    <input required type="number" value={createForm.unitPrice} onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", cursor: "pointer" }}>Save Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMovementModal && selectedItem && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "450px", borderRadius: "12px", padding: "24px" }}>
                        <h2 style={{ marginTop: 0, fontSize: "20px", color: "#0f172a" }}>Record Stock Movement</h2>
                        <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 16px 0" }}>Item: <strong>{selectedItem.itemName}</strong> (Current Stock: {selectedItem.currentStock} {selectedItem.unit})</p>
                        {errorMessage && <div style={{ background: "#ffe4e6", border: "1px solid #fecdd3", color: "#be123c", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "14px", fontWeight: "600" }}>🚫 {errorMessage}</div>}
                        <form onSubmit={handleRecordMovement} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Movement Type:</label>
                                <select value={movementForm.movementType} onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                                    <option value="Stock-Out">Stock-Out (Project Allocation)</option>
                                    <option value="Stock-In">Stock-In (New Delivery)</option>
                                    <option value="Damaged">Damaged (Wastage / Loss)</option>
                                    <option value="Returned">Returned (Site Return)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Quantity ({selectedItem.unit}):</label>
                                <input type="number" required min="1" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} placeholder={`Available: ${selectedItem.currentStock}`} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: "600" }}>Reference / Site Notes:</label>
                                <input type="text" placeholder="Dispatch slip # / Site location" value={movementForm.referenceNote} onChange={(e) => setMovementForm({ ...movementForm, referenceNote: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowMovementModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", cursor: "pointer" }}>Apply Movement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
