import { useState, useEffect } from "react";
import { createShipment, updateShipment } from "../shipmentApi";

const emptyForm = {
    shipmentType: "Import",
    supplier: "",
    country: "",
    port: "",
    invoiceNumber: "",
    lcNumber: "",
    carrier: "",
    trackingNumber: "",
    notes: "",
    shipmentDate: "",
    expectedArrival: "",
    customsStatus: "Pending",
    deliveryStatus: "Preparing",
    totalQuantity: 100,
    receivedQuantity: 0
};

export default function ShipmentForm({ selectedShipment, closeForm, onSaved }) {
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (selectedShipment) {
            setFormData({
                ...selectedShipment,
                shipmentDate: selectedShipment.shipmentDate ? selectedShipment.shipmentDate.slice(0, 10) : "",
                expectedArrival: selectedShipment.expectedArrival ? selectedShipment.expectedArrival.slice(0, 10) : ""
            });
        } else {
            setFormData(emptyForm);
        }
    }, [selectedShipment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "totalQuantity" || name === "receivedQuantity" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (Number(formData.receivedQuantity) > Number(formData.totalQuantity)) {
            setError("Received quantity cannot be greater than total shipped quantity.");
            return;
        }

        setSaving(true);
        try {
            if (selectedShipment) {
                await updateShipment(selectedShipment._id, formData);
                onSaved("Shipment updated successfully.");
            } else {
                await createShipment(formData);
                onSaved("New shipment tracked successfully.");
            }
            closeForm();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save shipment.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "28px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#2563eb", letterSpacing: "1px" }}>
                            Logistics Dispatch
                        </span>
                        <h2 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", color: "#0f172a" }}>
                            {selectedShipment ? "Edit Shipment Record" : "New Import / Export Shipment"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeForm}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "22px",
                            cursor: "pointer",
                            color: "#64748b"
                        }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: "10px 14px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#b91c1c",
                        fontSize: "13px",
                        marginBottom: "16px"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Shipment Type */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Shipment Type *
                        </label>
                        <select
                            name="shipmentType"
                            value={formData.shipmentType}
                            onChange={handleChange}
                            required
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                            <option value="Import">Import</option>
                            <option value="Export">Export</option>
                        </select>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Supplier / Shipper *
                        </label>
                        <input
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            placeholder="e.g. Global Tech Logistics"
                            required
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Origin / Destination Country *
                        </label>
                        <input
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="e.g. Germany / China"
                            required
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Port */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Port of Entry / Exit
                        </label>
                        <input
                            name="port"
                            value={formData.port}
                            onChange={handleChange}
                            placeholder="e.g. Chittagong Port"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Invoice Number */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Invoice Number
                        </label>
                        <input
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="e.g. INV-2026-9901"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* LC Number */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Letter of Credit (LC) Number
                        </label>
                        <input
                            name="lcNumber"
                            value={formData.lcNumber}
                            onChange={handleChange}
                            placeholder="e.g. LC-88390-BD"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Freight Carrier */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Shipping / Freight Carrier
                        </label>
                        <input
                            name="carrier"
                            value={formData.carrier || ""}
                            onChange={handleChange}
                            placeholder="e.g. Maersk / MSC / DHL / FedEx"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Tracking / Bill of Lading Number */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Tracking / Bill of Lading (BL) #
                        </label>
                        <input
                            name="trackingNumber"
                            value={formData.trackingNumber || ""}
                            onChange={handleChange}
                            placeholder="e.g. MAEU-9823001"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Shipment Date */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Shipment Date
                        </label>
                        <input
                            type="date"
                            name="shipmentDate"
                            value={formData.shipmentDate}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Expected Arrival */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Expected Arrival Date *
                        </label>
                        <input
                            type="date"
                            name="expectedArrival"
                            value={formData.expectedArrival}
                            onChange={handleChange}
                            required
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Customs Clearance Status */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Customs Clearance Status
                        </label>
                        <select
                            name="customsStatus"
                            value={formData.customsStatus}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Inspection">Under Inspection</option>
                            <option value="Cleared">Cleared</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Delivery Status */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Delivery Status
                        </label>
                        <select
                            name="deliveryStatus"
                            value={formData.deliveryStatus}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                            <option value="Preparing">Preparing</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Customs Hold">Customs Hold</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Successfully Closed">Successfully Closed (Received by Logistics)</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Total Quantity */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Total Shipped Quantity (Units)
                        </label>
                        <input
                            type="number"
                            name="totalQuantity"
                            min="1"
                            value={formData.totalQuantity}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Received Quantity (Partial Receiving) */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#334155" }}>
                            Received Quantity (Partial Receiving)
                        </label>
                        <input
                            type="number"
                            name="receivedQuantity"
                            min="0"
                            max={formData.totalQuantity}
                            value={formData.receivedQuantity}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                        <button
                            type="button"
                            onClick={closeForm}
                            style={{
                                padding: "10px 18px",
                                borderRadius: "8px",
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
                            disabled={saving}
                            style={{
                                padding: "10px 22px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#2563eb",
                                color: "white",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            {saving ? "Saving..." : selectedShipment ? "Save Changes" : "Track Shipment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
