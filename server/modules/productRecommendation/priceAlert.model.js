const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema({
    materialName: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ["Cement", "Rod/Steel", "Bricks", "Sand & Aggregate", "Tiles & Plumbing", "Electrical", "General"],
        default: "Cement"
    },
    targetMaxPriceBDT: { type: Number, required: true, min: 0 },
    currentMarketPriceBDT: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Triggered", "Dismissed"], default: "Active" },
    alertMessage: { type: String, trim: true, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("PriceAlert", priceAlertSchema);
