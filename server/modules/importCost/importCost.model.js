const mongoose = require("mongoose");

const importCostSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    itemName: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "Cement & Concrete" },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, trim: true, default: "Units" },
    warehouseLocation: { type: String, trim: true, default: "Central Depot" },

    foreignCurrency: { type: String, enum: ["USD", "CNY", "EUR", "GBP", "BDT"], default: "USD" },
    exchangeRate: { type: Number, required: true },
    isFallbackRate: { type: Boolean, default: false },

    // Component Costs (in foreign currency or BDT)
    productCost: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    customsDuty: { type: Number, default: 0, min: 0 },
    taxVAT: { type: Number, default: 0, min: 0 },
    otherCharges: { type: Number, default: 0, min: 0 },

    // Totals in BDT
    totalImportCostBDT: { type: Number, required: true },
    expectedSellingValueBDT: { type: Number, required: true },
    estimatedProfitBDT: { type: Number, required: true },
    profitMarginPercent: { type: Number, required: true },
    isProfitable: { type: Boolean, default: true },

    // Manager Approval Workflow
    managerApprovalStatus: {
        type: String,
        enum: ["Pending Manager Approval", "Manager Approved", "Manager Rejected"],
        default: "Pending Manager Approval"
    },
    approvedByManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Finance Approval Workflow
    financeApprovalStatus: {
        type: String,
        enum: ["Pending Finance Approval", "Finance Approved", "Finance Rejected"],
        default: "Pending Finance Approval"
    },
    approvedByFinance: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvalNotes: { type: String, trim: true, default: "" },

    // Receipt into Inventory Stock
    receivingStatus: {
        type: String,
        enum: ["Not Received", "Received"],
        default: "Not Received"
    },
    receivedAt: { type: Date, default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Supplier Import Shipping & Customs Order Status
    orderStatus: {
        type: String,
        enum: [
            "Requisition Created",
            "LC Opened",
            "In Production / Packed",
            "Dispatched / In Transit",
            "Customs Clearance",
            "Arrived at Port / Warehouse",
            "Delivered",
            "Successfully Closed",
            "Closed / Received by Logistics",
            "Cancelled"
        ],
        default: "Requisition Created"
    },
    assignedSupplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    supplierName: { type: String, default: "" },
    carrier: { type: String, trim: true, default: "" },
    trackingNumber: { type: String, trim: true, default: "" },
    estimatedArrival: { type: Date, default: null },
    supplierStatusNotes: { type: String, trim: true, default: "" },
    statusUpdatedAt: { type: Date, default: null },

    notes: { type: String, trim: true, default: "" },
    calculatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("ImportCost", importCostSchema);

