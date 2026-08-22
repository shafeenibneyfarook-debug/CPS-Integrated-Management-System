const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
            alias: "company"
        },
        contactPerson: {
            type: String,
            required: [true, "Contact person is required"],
            trim: true,
            alias: "name"
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
        },
        clientType: {
            type: String,
            required: [true, "Client type is required"],
            trim: true,
            enum: ["Individual", "Company", "Corporate", "Government"]
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

module.exports = mongoose.model("Client", clientSchema);
