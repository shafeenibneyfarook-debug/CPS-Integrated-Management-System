import React, { useEffect, useState, useCallback } from "react";
import { getShipments, deleteShipment, patchShipment } from "../shipmentApi";
import ShipmentForm from "../components/ShipmentForm";
import { useAuth } from "../../auth/authStore";
import "../shipment.css";

export default function ShipmentList() {
    const { user } = useAuth();
    const isSupplier = user?.role === "supplier";
    const isAdmin = user?.role === "admin";
    const canInitiate = isSupplier || isAdmin;
    const canEditSupplier = isSupplier || isAdmin; // Strictly Suppliers & Admin can edit shipment tracking details
    const canReceiveLogistics = user?.role === "operations_officer" || user?.role === "staff" || isAdmin;
    const canDelete = user?.role === "operations_officer" || isAdmin;

    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: "", shipmentType: "", customsStatus: "", deliveryStatus: "", delayed: false });
    const [showForm, setShowForm] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [receivingModal, setReceivingModal] = useState(null);
    const [receivingQtyInput, setReceivingQtyInput] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadShipments = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.shipmentType) params.shipmentType = filters.shipmentType;
            if (filters.customsStatus) params.customsStatus = filters.customsStatus;
            if (filters.deliveryStatus) params.deliveryStatus = filters.deliveryStatus;
            if (filters.delayed) params.delayed = "true";

            const res = await getShipments(params);
            const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
            setShipments(list);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load shipments.");
            setShipments([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(loadShipments, 200);
        return () => clearTimeout(timer);
    }, [loadShipments]);

    const handleDelete = async (id, title) => {
        if (!canDelete) return;
        if (!window.confirm(`Delete shipment record for "${title}"?`)) return;
        try {
            await deleteShipment(id);
            setMessage("Shipment removed successfully.");
            loadShipments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete shipment.");
        }
    };

    const handleQuickReceive = async (e) => {
        e.preventDefault();
        if (!receivingModal || !canReceiveLogistics) return;

        const newQty = Number(receivingQtyInput);
        if (isNaN(newQty) || newQty < 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (newQty > Number(receivingModal.totalQuantity)) {
            alert(`Received quantity cannot exceed total quantity (${receivingModal.totalQuantity}).`);
            return;
        }

        const isFullyReceived = newQty >= Number(receivingModal.totalQuantity);

        try {
            await patchShipment(receivingModal._id, {
                receivedQuantity: newQty,
                deliveryStatus: isFullyReceived ? "Successfully Closed" : "In Transit"
            });
            setMessage(isFullyReceived
                ? `🎉 Full quantity received for ${receivingModal.supplier}! Shipment marked as "Successfully Closed".`
                : `Updated received quantity for ${receivingModal.supplier} (${newQty}/${receivingModal.totalQuantity}).`
            );
            setReceivingModal(null);
            loadShipments();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update received quantity.");
        }
    };

    // Calculate Summary Metrics Safely
    const safeShipments = Array.isArray(shipments) ? shipments : [];
    const totalCount = safeShipments.length;
    const delayedCount = safeShipments.filter((s) => s.isDelayed).length;
    const clearedCount = safeShipments.filter((s) => s.customsStatus === "Cleared").length;
    const deliveredCount = safeShipments.filter((s) => s.deliveryStatus === "Delivered" || s.deliveryStatus === "Successfully Closed").length;

    return (
        <div className="shipment-page">
            {/* Page Header */}
            <div className="shipment-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <span className="shipment-eyebrow">Logistics & Freight Management</span>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Import & Export Shipment Tracking</h1>
                    <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>
                        Monitor international freight routes, customs clearance, LC documentation, and delay warnings.
                    </p>
                </div>

                {canInitiate && (
                    <button
                        className="primary-action-btn"
                        onClick={() => {
                            setSelectedShipment(null);
                            setShowForm(true);
                        }}
                        style={{
                            padding: "10px 18px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "800",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        + Initiate New Shipment
                    </button>
                )}
            </div>

            {/* Notifications */}
            {message && (
                <div className="shipment-alert success">
                    <span>{message}</span>
                    <button onClick={() => setMessage("")}>×</button>
                </div>
            )}
            {error && (
                <div className="shipment-alert error">
                    <span>{error}</span>
                    <button onClick={() => setError("")}>×</button>
                </div>
            )}

            {/* Modern Clean KPI Metrics Row */}
            <div className="shipment-kpi-grid">
                <div className="shipment-kpi-card">
                    <span className="kpi-title">Total Tracked</span>
                    <strong className="kpi-value font-mono">{totalCount}</strong>
                    <span className="kpi-sub">Active freight records</span>
                </div>
                <div className={`shipment-kpi-card ${delayedCount > 0 ? "warning" : ""}`}>
                    <span className="kpi-title">Delay Warning</span>
                    <strong className={`kpi-value font-mono ${delayedCount > 0 ? "delayed-text" : ""}`}>{delayedCount}</strong>
                    <span className="kpi-sub">{delayedCount > 0 ? "ETA exceeded schedule" : "All shipments on schedule"}</span>
                </div>
                <div className="shipment-kpi-card success">
                    <span className="kpi-title">Customs Cleared</span>
                    <strong className="kpi-value font-mono">{clearedCount}</strong>
                    <span className="kpi-sub">Ready for final dispatch</span>
                </div>
                <div className="shipment-kpi-card">
                    <span className="kpi-title">Fully Delivered</span>
                    <strong className="kpi-value font-mono">{deliveredCount}</strong>
                    <span className="kpi-sub">Completed receiving</span>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="shipment-card">
                <div className="shipment-filter-bar">
                    <input
                        type="text"
                        placeholder="Search supplier, country, port, invoice, or LC..."
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="shipment-search"
                    />

                    <select
                        value={filters.shipmentType}
                        onChange={(e) => setFilters((prev) => ({ ...prev, shipmentType: e.target.value }))}
                    >
                        <option value="">All Types (Import / Export)</option>
                        <option value="Import">Import</option>
                        <option value="Export">Export</option>
                    </select>

                    <select
                        value={filters.customsStatus}
                        onChange={(e) => setFilters((prev) => ({ ...prev, customsStatus: e.target.value }))}
                    >
                        <option value="">All Customs Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Under Inspection">Under Inspection</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    <select
                        value={filters.deliveryStatus}
                        onChange={(e) => setFilters((prev) => ({ ...prev, deliveryStatus: e.target.value }))}
                    >
                        <option value="">All Delivery Statuses</option>
                        <option value="Preparing">Preparing</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Customs Hold">Customs Hold</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Successfully Closed">Successfully Closed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <label className="checkbox-filter">
                        <input
                            type="checkbox"
                            checked={filters.delayed}
                            onChange={(e) => setFilters((prev) => ({ ...prev, delayed: e.target.checked }))}
                        />
                        Delayed Only
                    </label>

                    {(filters.search || filters.shipmentType || filters.customsStatus || filters.deliveryStatus || filters.delayed) && (
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={() => setFilters({ search: "", shipmentType: "", customsStatus: "", deliveryStatus: "", delayed: false })}
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Table View */}
                <div className="shipment-table-wrap">
                    <table className="shipment-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Supplier / Shipper</th>
                                <th>Country & Port</th>
                                <th>Invoice & LC</th>
                                <th>Timeline & Arrival</th>
                                <th>Customs</th>
                                <th>Delivery Status</th>
                                <th>Partial Receiving</th>
                                {(canReceiveLogistics || canEditSupplier || canDelete) && <th style={{ textAlign: "center" }}>Actions</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="table-status-msg">
                                        Loading shipment data...
                                    </td>
                                </tr>
                            ) : safeShipments.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="table-status-msg">
                                        No shipment records found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                safeShipments.map((shipment) => {
                                    const total = Number(shipment.totalQuantity) || 1;
                                    const received = Number(shipment.receivedQuantity) || 0;
                                    const percent = Math.min(100, Math.round((received / total) * 100));
                                    const isClosed = shipment.deliveryStatus === "Successfully Closed" || (percent >= 100 && shipment.deliveryStatus === "Delivered");

                                    return (
                                        <tr key={shipment._id}>
                                            <td>
                                                <span className={`type-badge ${(shipment.shipmentType || "import").toLowerCase()}`}>
                                                    {shipment.shipmentType || "Import"}
                                                </span>
                                            </td>

                                            <td>
                                                <strong>{shipment.supplier}</strong>
                                            </td>

                                            <td>
                                                <div>{shipment.country}</div>
                                                <small className="muted-text">{shipment.port || "Standard Port"}</small>
                                            </td>

                                            <td>
                                                <div><strong>{shipment.invoiceNumber || "—"}</strong></div>
                                                <small className="muted-text">LC: {shipment.lcNumber || "—"}</small>
                                                {shipment.carrier && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Carrier: {shipment.carrier}</div>}
                                                {shipment.trackingNumber && <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: "700" }}>Track #: {shipment.trackingNumber}</div>}
                                            </td>

                                            <td>
                                                <div>
                                                    {shipment.expectedArrival ? new Date(shipment.expectedArrival).toLocaleDateString() : "—"}
                                                </div>
                                                {shipment.isDelayed ? (
                                                    <span className="delay-tag">
                                                        Delayed Arrival
                                                    </span>
                                                ) : (
                                                    <small className="on-time-tag">On Schedule</small>
                                                )}
                                            </td>

                                            <td>
                                                <span className={`customs-tag ${(shipment.customsStatus || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                                                    {shipment.customsStatus || "Pending"}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`delivery-tag ${(shipment.deliveryStatus || "preparing").toLowerCase().replace(/\s+/g, "-")}`}>
                                                    {isClosed ? "✅ Successfully Closed" : (shipment.deliveryStatus || "Preparing")}
                                                </span>
                                            </td>

                                            <td>
                                                <div style={{ minWidth: "120px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                                                        <span className="font-mono">{received} / {total}</span>
                                                        <strong className="font-mono">{percent}%</strong>
                                                    </div>
                                                    <div style={{ background: "#e2e8f0", height: "5px", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div style={{
                                                             background: percent >= 100 ? "#059669" : percent > 0 ? "#2563eb" : "#cbd5e1",
                                                            width: `${percent}%`,
                                                            height: "100%",
                                                            transition: "width 0.3s ease"
                                                        }} />
                                                    </div>
                                                </div>
                                            </td>

                                            {(canReceiveLogistics || canEditSupplier || canDelete) && (
                                                <td style={{ textAlign: "center" }}>
                                                    <div className="table-actions" style={{ justifyContent: "center" }}>
                                                        {canReceiveLogistics && (
                                                            !isClosed ? (
                                                                <button
                                                                    type="button"
                                                                    className="btn-receive"
                                                                    onClick={() => {
                                                                        setReceivingModal(shipment);
                                                                        setReceivingQtyInput(shipment.receivedQuantity || 0);
                                                                    }}
                                                                >
                                                                    Receive
                                                                </button>
                                                            ) : (
                                                                <span style={{ fontSize: "11px", color: "#059669", fontWeight: "800", background: "#ecfdf5", padding: "4px 8px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                                                                    🔒 Closed
                                                                </span>
                                                            )
                                                        )}

                                                        {/* EDIT BUTTON STRICTLY RESTRICTED TO SUPPLIERS */}
                                                        {canEditSupplier && (
                                                            <button
                                                                type="button"
                                                                className="btn-edit"
                                                                onClick={() => {
                                                                    setSelectedShipment(shipment);
                                                                    setShowForm(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                className="btn-delete"
                                                                onClick={() => handleDelete(shipment._id, shipment.supplier)}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Partial Receiving Modal */}
            {receivingModal && canReceiveLogistics && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Update Partial Receiving</h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                            Supplier: <strong>{receivingModal.supplier}</strong> (Total Ordered: {receivingModal.totalQuantity} units)
                        </p>

                        <form onSubmit={handleQuickReceive}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                                Total Received Units to Date *
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={receivingModal.totalQuantity}
                                value={receivingQtyInput}
                                onChange={(e) => setReceivingQtyInput(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    marginBottom: "16px",
                                    outline: "none"
                                }}
                                required
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setReceivingModal(null)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        background: "white",
                                        color: "#475569",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: "8px 18px",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: "#2563eb",
                                        color: "white",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shipment Form Modal */}
            {showForm && (canInitiate || canEditLogistics) && (
                <ShipmentForm
                    selectedShipment={selectedShipment}
                    closeForm={() => {
                        setShowForm(false);
                        setSelectedShipment(null);
                    }}
                    onSaved={(text) => {
                        setMessage(text);
                        loadShipments();
                    }}
                />
            )}
        </div>
    );
}