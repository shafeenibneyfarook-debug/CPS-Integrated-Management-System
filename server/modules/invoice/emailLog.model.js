const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    emailType: {
        type: String,
        enum: [
            "Quotation Submission",
            "Invoice Generation",
            "Payment Reminder",
            "Milestone Progress Alert",
            "Project Delay Notice",
            "Finance Dues Clearance Alert",
            "Project Delivery Confirmation",
            "Custom Alert"
        ],
        required: true
    },
    referenceId: { type: String, default: "" }, // Quotation ID or Invoice ID
    referenceModel: { type: String, default: "" },
    status: { type: String, enum: ["Success", "Failed"], default: "Success" },
    errorMessage: { type: String, default: "" },
    attempts: { type: Number, default: 1 },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

module.exports = mongoose.model("EmailLog", emailLogSchema);
