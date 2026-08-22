const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    supplierName: { type: String, required: [true, "Supplier name is required"], trim: true },
    country: { type: String, required: [true, "Country is required"], trim: true },
    contactPerson: { type: String, required: [true, "Contact person is required"], trim: true },
    productCategory: { type: String, required: [true, "Product category is required"], trim: true },
    phone: { type: String, required: [true, "Phone number is required"], trim: true },
    email: {
        type: String, required: [true, "Email is required"], trim: true, lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    address: { type: String, required: [true, "Address is required"], trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema);
