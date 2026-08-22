const User = require("./user.model");
const Supplier = require("../supplier/supplier.model");
const Client = require("../client/client.model");
const { hashPassword, verifyPassword, createToken } = require("./auth.utils");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role, companyName, country, productCategory, address } = req.body;
        if (!name?.trim() || !emailPattern.test(email || "") || !phone?.trim() || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ message: "Name, valid email, phone, and a password of at least 8 characters are required" });
        }
        if (await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: "An account with this email already exists" });

        const isFirstUser = (await User.countDocuments()) === 0;
        const validRoles = ["admin", "manager", "operations_officer", "staff", "accounts_officer", "client", "supplier"];
        let assignedRole = isFirstUser ? "admin" : "client";
        if (role && validRoles.includes(role)) {
            assignedRole = isFirstUser ? "admin" : role;
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            passwordHash: await hashPassword(password),
            role: assignedRole
        });

        // Auto-provision Directory Record
        if (assignedRole === "supplier") {
            const supplierName = (companyName || name).trim();
            if (!await Supplier.exists({ email: email.toLowerCase().trim() })) {
                await Supplier.create({
                    supplierName,
                    country: (country || "Bangladesh").trim(),
                    contactPerson: name.trim(),
                    productCategory: (productCategory || "Construction Materials & Services").trim(),
                    phone: phone.trim(),
                    email: email.toLowerCase().trim(),
                    address: (address || "Vendor Address").trim(),
                    status: "Active"
                });
            }
        } else if (assignedRole === "client") {
            const company = (companyName || `${name} Projects`).trim();
            if (!await Client.exists({ email: email.toLowerCase().trim() })) {
                await Client.create({
                    companyName: company,
                    contactPerson: name.trim(),
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    clientType: "Company",
                    address: (address || "Corporate Office").trim(),
                    status: "Active"
                });
            }
        }

        return res.status(201).json({ token: createToken(user), user, message: isFirstUser ? "Administrator account created" : `${assignedRole.toUpperCase()} account registered successfully!` });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
        return res.status(500).json({ message: "Unable to create account" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = (email || "").toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail }).select("+passwordHash");
        if (!user) {
            return res.status(401).json({ message: `No user account found with email "${cleanEmail}". Please check your email address or register.` });
        }
        if (!(await verifyPassword(password || "", user.passwordHash))) {
            return res.status(401).json({ message: "Incorrect password. Please verify your password and try again." });
        }
        if (!user.isActive) return res.status(403).json({ message: "This account has been deactivated" });
        user.lastLoginAt = new Date();
        await user.save();
        return res.json({ token: createToken(user), user });
    } catch (_error) {
        return res.status(500).json({ message: "Unable to sign in. Please try again." });
    }
};

exports.me = (req, res) => res.json({ user: req.user });

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, currentPassword, newPassword } = req.body;
        if (name !== undefined) req.user.name = name.trim();
        if (phone !== undefined) req.user.phone = phone.trim();
        if (newPassword) {
            if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
            const userWithPassword = await User.findById(req.user._id).select("+passwordHash");
            if (!(await verifyPassword(currentPassword || "", userWithPassword.passwordHash))) return res.status(400).json({ message: "Current password is incorrect" });
            req.user.passwordHash = await hashPassword(newPassword);
        }
        await req.user.save();
        return res.json({ user: req.user, message: "Profile updated" });
    } catch (_error) {
        return res.status(400).json({ message: "Unable to update profile" });
    }
};
