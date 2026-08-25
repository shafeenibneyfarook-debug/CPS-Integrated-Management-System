const mongoose = require("mongoose");

const scrapedPriceSchema = new mongoose.Schema({
    itemName: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ["Cement", "Rod/Steel", "Bricks", "Sand & Aggregate", "Labour"],
        required: true
    },
    brand: { type: String, trim: true, default: "Generic" },
    unit: { type: String, required: true }, // e.g. Bag, Ton, 1000 Pcs, CFT, Day Rate
    priceBDT: { type: Number, required: true, min: 0 },
    previousAvgPriceBDT: { type: Number, default: 0 },
    priceVariancePercent: { type: Number, default: 0 },
    source: { type: String, required: true, trim: true }, // e.g., BDStall, Akij Cement, BSRM Direct, Labour Union
    sourceUrl: { type: String, trim: true, default: "" },
    scrapedDate: { type: Date, default: Date.now },

    // Price Item Status
    verificationStatus: {
        type: String,
        enum: ["Verified", "Pending Review", "Flagged"],
        default: "Verified"
    },
    flagReason: { type: String, trim: true, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    // Supplier Quantity Supply Offer & Logistics Verification
    availableQuantity: { type: Number, default: 0, min: 0 },
    supplierNotes: { type: String, trim: true, default: "" },
    supplierUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    supplierName: { type: String, trim: true, default: "" },
    quantityVerificationStatus: {
        type: String,
        enum: ["Pending Supplier Offer", "Pending Verification", "Logistics Verified", "Rejected"],
        default: "Pending Supplier Offer"
    },
    quantityVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    quantityVerifiedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("ScrapedPrice", scrapedPriceSchema);
