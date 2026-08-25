const mongoose = require("mongoose");

const paymentRecordSchema = new mongoose.Schema({
    amount: { type: Number, required: true, min: [0.01, "Payment amount must be greater than zero"] },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
        type: String,
        enum: ["Bank Transfer", "Cheque", "Cash", "Mobile Banking", "Credit Card"],
        default: "Bank Transfer"
    },
    referenceNotes: { type: String, trim: true, default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: true });

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", default: null },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: [true, "Client reference is required"] },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    items: { type: [invoiceItemSchema], required: true },
    subtotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
        type: String,
        enum: ["Paid", "Unpaid", "Partially Paid"],
        default: "Unpaid"
    },
    financeVerificationStatus: {
        type: String,
        enum: ["Pending Finance Verification", "Finance Verified", "Finance Rejected"],
        default: "Pending Finance Verification"
    },
    financeOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    financeVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    payments: [paymentRecordSchema],
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

invoiceSchema.pre("validate", function () {
    // Calculate line totals & overall total
    if (this.items && this.items.length > 0) {
        this.items.forEach(item => {
            item.total = Number((item.quantity * item.unitPrice).toFixed(2));
        });
        this.subtotal = Number(this.items.reduce((sum, i) => sum + i.total, 0).toFixed(2));
    }
    this.taxAmount = Number((this.subtotal * (this.taxRate || 0) / 100).toFixed(2));
    this.totalAmount = Number((this.subtotal + this.taxAmount).toFixed(2));

    // Calculate total paid and due amount
    const totalPaid = (this.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    this.paidAmount = Number(totalPaid.toFixed(2));
    this.dueAmount = Number(Math.max(0, this.totalAmount - this.paidAmount).toFixed(2));

    // Determine status
    if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
        this.paymentStatus = "Paid";
        this.dueAmount = 0;
    } else if (this.paidAmount > 0) {
        this.paymentStatus = "Partially Paid";
    } else {
        this.paymentStatus = "Unpaid";
    }
});

module.exports = mongoose.model("Invoice", invoiceSchema);
