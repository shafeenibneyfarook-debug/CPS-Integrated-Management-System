const mongoose = require("mongoose");
const Supplier = require("./supplier.model");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const sendError = (res, error) => {
    if (error.name === "ValidationError") {
        return res.status(400).json({
            message: "Validation failed",
            errors: Object.values(error.errors).map((item) => item.message)
        });
    }
    return res.status(500).json({ message: "Internal server error" });
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\d\s+\-()]{6,25}$/;

const validateContactDetails = ({ email, phone }) => {
    const errors = [];
    if (email && !emailPattern.test(email.trim())) {
        errors.push("Invalid contact details: Please enter a valid email address (e.g. name@domain.com).");
    }
    if (phone && !phonePattern.test(phone.trim())) {
        errors.push("Invalid contact details: Please enter a valid phone number (min 6 digits).");
    }
    return errors;
};

exports.createSupplier = async (req, res) => {
    try {
        const { supplierName, country, contactPerson, productCategory, phone, email, address, status } = req.body;
        
        // Validate contact details
        const contactErrors = validateContactDetails({ email, phone });
        if (contactErrors.length > 0) {
            return res.status(400).json({ message: contactErrors.join(" "), errors: contactErrors });
        }

        const targetName = (supplierName || "").trim();
        const targetEmail = (email || "").toLowerCase().trim();
        const targetPhone = (phone || "").trim();

        // Duplicate Supplier Detection
        if (targetEmail) {
            const existingEmail = await Supplier.findOne({ email: targetEmail });
            if (existingEmail) {
                return res.status(409).json({ message: `Duplicate supplier detected: A supplier with email '${targetEmail}' already exists.` });
            }
        }
        if (targetName) {
            const existingName = await Supplier.findOne({
                supplierName: new RegExp(`^${targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            });
            if (existingName) {
                return res.status(409).json({ message: `Duplicate supplier detected: A supplier named '${targetName}' already exists.` });
            }
        }
        if (targetPhone) {
            const existingPhone = await Supplier.findOne({ phone: targetPhone });
            if (existingPhone) {
                return res.status(409).json({ message: `Duplicate supplier detected: A supplier with phone '${targetPhone}' already exists.` });
            }
        }

        const supplier = await Supplier.create(req.body);
        return res.status(201).json(supplier);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate supplier detected: Record already exists." });
        }
        return sendError(res, error);
    }
};

exports.getSuppliers = async (req, res) => {
    try {
        const { search, status, country, productCategory } = req.query;
        const filter = {};
        if (search?.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(escaped, "i");
            filter.$or = [
                { supplierName: pattern }, { contactPerson: pattern },
                { email: pattern }, { phone: pattern }, { productCategory: pattern }
            ];
        }
        if (status) filter.status = status;
        if (country) filter.country = new RegExp(`^${country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        if (productCategory) filter.productCategory = new RegExp(`^${productCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        return res.status(200).json(await Supplier.find(filter).sort({ createdAt: -1 }));
    } catch (error) { return sendError(res, error); }
};

exports.getSupplierById = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid supplier ID" });
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        return res.status(200).json(supplier);
    } catch (error) { return sendError(res, error); }
};

exports.updateSupplier = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid supplier ID" });
        
        const { supplierName, phone, email } = req.body;
        
        // Validate contact details if provided
        if (email || phone) {
            const contactErrors = validateContactDetails({ email, phone });
            if (contactErrors.length > 0) {
                return res.status(400).json({ message: contactErrors.join(" "), errors: contactErrors });
            }
        }

        const targetName = (supplierName || "").trim();
        const targetEmail = (email || "").toLowerCase().trim();
        const targetPhone = (phone || "").trim();

        // Duplicate Supplier Detection on Update (excluding current supplier)
        if (targetEmail) {
            const existingEmail = await Supplier.findOne({ email: targetEmail, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(409).json({ message: `Duplicate supplier detected: Another supplier already uses email '${targetEmail}'.` });
            }
        }
        if (targetName) {
            const existingName = await Supplier.findOne({
                _id: { $ne: req.params.id },
                supplierName: new RegExp(`^${targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            });
            if (existingName) {
                return res.status(409).json({ message: `Duplicate supplier detected: Another supplier is already named '${targetName}'.` });
            }
        }
        if (targetPhone) {
            const existingPhone = await Supplier.findOne({ phone: targetPhone, _id: { $ne: req.params.id } });
            if (existingPhone) {
                return res.status(409).json({ message: `Duplicate supplier detected: Another supplier already uses phone '${targetPhone}'.` });
            }
        }

        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        return res.status(200).json(supplier);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate supplier detected: Record already exists." });
        }
        return sendError(res, error);
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid supplier ID" });
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        return res.status(200).json({ message: "Supplier deleted successfully", supplier });
    } catch (error) { return sendError(res, error); }
};
