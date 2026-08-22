const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
    description: { type: String, required: [true, "Item description is required"], trim: true },
    quantity: { type: Number, required: true, min: [0.01, "Quantity must be greater than zero"] },
    unitPrice: { type: Number, required: true, min: [0, "Unit price cannot be negative"] },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    total: { type: Number, min: 0, default: 0 }
}, { _id: true });

const quotationSchema = new mongoose.Schema({
    quotationNumber: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: [true, "Building or Construction Title is required"], trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: [true, "Client is required"] },
    tenderReference: { type: String, trim: true, default: "" },
    constructionSiteLocation: { type: String, trim: true, default: "" },
    validUntil: { type: Date, required: [true, "Validity date is required"] },
    currency: { type: String, enum: ["BDT", "USD", "EUR", "GBP"], default: "BDT" },
    items: { type: [quotationItemSchema], validate: [(items) => items.length > 0, "At least one item is required"] },
    subtotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["Draft", "Submitted", "Approved", "Rejected", "Revised"], default: "Draft" },

    // Building & Land Specification Parameters
    approximateAreaSqFt: { type: Number, default: 1500, min: 0 },
    numberOfFloors: { type: Number, default: 1, min: 1 },
    projectType: { type: String, default: "Residential Building", trim: true },
    materialQuality: { type: String, default: "Standard", trim: true },
    labourCategory: { type: String, default: "Standard", trim: true },

    // Manager AI 3-Tier Budget Options & Client Selection
    tierOptions: { type: mongoose.Schema.Types.Mixed, default: null },
    selectedTier: { type: String, enum: ["low", "standard", "premium", null], default: null },

    // Full Operational Lifecycle Bidding Fields
    managerProposalNotes: { type: String, trim: true, default: "" },
    adminVerificationStatus: {
        type: String,
        enum: ["Pending Admin Approval", "Admin Verified", "Admin Rejected"],
        default: "Pending Admin Approval"
    },
    adminVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminVerifiedAt: { type: Date, default: null },

    clientDecision: {
        type: String,
        enum: ["Pending Client Review", "Accepted", "Rejected"],
        default: "Pending Client Review"
    },
    clientDecisionNotes: { type: String, trim: true, default: "" },
    clientDecidedAt: { type: Date, default: null },

    notes: { type: String, trim: true, default: "" },
    rejectionReason: { type: String, trim: true, default: "" },
    version: { type: Number, default: 1, min: 1 },
    rootQuotation: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", default: null },
    revisedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

quotationSchema.pre("validate", function calculateTotals() {
    this.items.forEach((item) => { item.total = Number((item.quantity * item.unitPrice).toFixed(2)); });
    this.subtotal = Number(this.items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    this.taxAmount = Number((this.subtotal * this.taxRate / 100).toFixed(2));
    this.total = Number((this.subtotal + this.taxAmount).toFixed(2));
});

module.exports = mongoose.model("Quotation", quotationSchema);
