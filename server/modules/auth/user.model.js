const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "manager", "operations_officer", "staff", "accounts_officer", "client", "supplier"], default: "client" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date
}, { timestamps: true });

userSchema.set("toJSON", {
    transform: (_document, value) => {
        delete value.passwordHash;
        delete value.__v;
        return value;
    }
});

module.exports = mongoose.model("User", userSchema);
