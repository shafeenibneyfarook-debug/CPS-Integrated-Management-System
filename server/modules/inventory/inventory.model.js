const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
    itemCode: { type: String, required: true, unique: true, trim: true },
    itemName: { type: String, required: [true, "Item name is required"], trim: true },
    category: {
        type: String,
        enum: ["Cement & Concrete", "Steel & Rod", "Bricks & Blocks", "Sand & Aggregate", "Tiles & Plumbing", "Electrical & Lighting", "Labour Tools & Equipment", "General"],
        default: "General"
    },
    unit: { type: String, required: true, default: "Pcs" }, // e.g. Bags, Tons, Pcs, CFT
    currentStock: { type: Number, required: true, min: [0, "Stock quantity cannot be negative"], default: 0 },
    minStockLevel: { type: Number, required: true, min: 0, default: 10 },
    unitPrice: { type: Number, default: 0, min: 0 },
    warehouseLocation: { type: String, trim: true, default: "Main Warehouse" },
    status: { type: String, enum: ["In Stock", "Low Stock", "Out of Stock"], default: "In Stock" }
}, { timestamps: true });

inventorySchema.pre("save", function () {
    if (this.currentStock <= 0) {
        this.status = "Out of Stock";
    } else if (this.currentStock <= this.minStockLevel) {
        this.status = "Low Stock";
    } else {
        this.status = "In Stock";
    }
});

module.exports = mongoose.model("InventoryItem", inventorySchema);
