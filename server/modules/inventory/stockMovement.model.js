const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema({
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    movementType: {
        type: String,
        enum: ["Stock-In", "Stock-Out", "Damaged", "Returned"],
        required: true
    },
    quantity: { type: Number, required: true, min: [0.01, "Quantity must be greater than 0"] },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceNote: { type: String, trim: true, default: "" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("StockMovement", stockMovementSchema);
