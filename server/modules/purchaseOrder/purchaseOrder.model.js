const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema({
    description: { type: String, required: [true, "Item description is required"], trim: true },
    quantity: { type: Number, required: true, min: [0.01, "Quantity must be greater than zero"] },
    unitPrice: { type: Number, required: true, min: [0, "Unit price cannot be negative"] },
    receivedQuantity: { type: Number, default: 0, min: [0, "Received quantity cannot be negative"] },
    total: { type: Number, default: 0, min: 0 }
});

const purchaseOrderSchema = new mongoose.Schema({
    purchaseOrderNumber: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: [true, "Purchase order title is required"], trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: [true, "Supplier is required"] },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    orderDate: { type: Date, required: [true, "Order date is required"] },
    expectedDelivery: { type: Date, required: [true, "Expected delivery date is required"] },
    currency: { type: String, enum: ["BDT", "USD", "EUR", "GBP"], default: "BDT" },
    items: { type: [purchaseOrderItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    subtotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    approvalStatus: {
        type: String,
        enum: ["Draft", "Pending Manager Approval", "Manager Approved", "Approved", "Rejected"],
        default: "Pending Manager Approval"
    },
    receivingStatus: { type: String, enum: ["Not Received", "Partially Received", "Received"], default: "Not Received" },
    supplierAcceptanceStatus: {
        type: String,
        enum: ["Pending Acceptance", "Accepted", "Declined"],
        default: "Pending Acceptance"
    },
    acceptedSupplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    acceptedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    managerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    managerApprovedAt: { type: Date, default: null },
    financeApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    financeApprovedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null }
}, { timestamps: true });

purchaseOrderSchema.pre("validate", function calculateTotals() {
    this.items.forEach((item) => {
        if (item.receivedQuantity > item.quantity) item.invalidate("receivedQuantity", "Received quantity cannot exceed ordered quantity");
        item.total = Number((item.quantity * item.unitPrice).toFixed(2));
    });
    this.subtotal = Number(this.items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    this.taxAmount = Number((this.subtotal * this.taxRate / 100).toFixed(2));
    this.total = Number((this.subtotal + this.taxAmount).toFixed(2));
});

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
