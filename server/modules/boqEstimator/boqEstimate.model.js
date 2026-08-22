const mongoose = require("mongoose");

const boqEstimateSchema = new mongoose.Schema({
    estimateName: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    projectType: {
        type: String,
        enum: ["Residential Building", "Commercial Complex", "Industrial Warehouse", "Renovation & Extension"],
        required: true
    },
    approximateAreaSqFt: { type: Number, required: true, min: 100 },
    numberOfFloors: { type: Number, required: true, min: 1, default: 1 },
    materialQuality: { type: String, enum: ["Standard", "Premium", "Luxury"], default: "Standard" },
    labourCategory: { type: String, enum: ["Standard", "Skilled", "Specialized"], default: "Standard" },

    // 3 Budget Tier Summaries (BDT)
    lowBudgetTotalBDT: { type: Number, required: true },
    standardBudgetTotalBDT: { type: Number, required: true },
    premiumBudgetTotalBDT: { type: Number, required: true },

    // Itemized Breakdown Options JSON
    breakdownOptions: { type: Object, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("BoqEstimate", boqEstimateSchema);
