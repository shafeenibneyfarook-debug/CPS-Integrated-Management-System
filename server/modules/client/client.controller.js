const mongoose = require("mongoose");
const Client = require("./client.model");

const sendError = (res, error) => {
    if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((item) => item.message);
        return res.status(400).json({ message: "Validation failed", errors });
    }

    return res.status(500).json({ message: "Internal server error" });
};

const hasValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createClient = async (req, res) => {
    try {
        const { companyName, company, email, phone } = req.body;
        const targetCompany = (companyName || company || "").trim();
        const targetEmail = (email || "").toLowerCase().trim();
        const targetPhone = (phone || "").trim();

        // Duplicate Client Detection
        if (targetEmail) {
            const existingEmail = await Client.findOne({ email: targetEmail });
            if (existingEmail) {
                return res.status(409).json({ message: `Duplicate client detected: A client with email '${targetEmail}' already exists.` });
            }
        }
        if (targetCompany) {
            const existingCompany = await Client.findOne({
                $or: [{ companyName: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }, { company: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }]
            });
            if (existingCompany) {
                return res.status(409).json({ message: `Duplicate client detected: A client with company name '${targetCompany}' already exists.` });
            }
        }
        if (targetPhone) {
            const existingPhone = await Client.findOne({ phone: targetPhone });
            if (existingPhone) {
                return res.status(409).json({ message: `Duplicate client detected: A client with phone '${targetPhone}' already exists.` });
            }
        }

        const client = await Client.create(req.body);
        return res.status(201).json(client);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate client detected: Record already exists." });
        }
        return sendError(res, error);
    }
};

exports.getClients = async (req, res) => {
    try {
        const { search, status, clientType } = req.query;
        const filter = {};

        if (search?.trim()) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(escapedSearch, "i");
            filter.$or = [
                { companyName: pattern },
                { contactPerson: pattern },
                { email: pattern },
                { phone: pattern }
            ];
        }

        if (status) filter.status = status;
        if (clientType) filter.clientType = clientType;

        const clients = await Client.find(filter).sort({ createdAt: -1 });
        return res.status(200).json(clients);
    } catch (error) {
        return sendError(res, error);
    }
};

exports.getClientById = async (req, res) => {
    try {
        if (!hasValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });

        return res.status(200).json(client);
    } catch (error) {
        return sendError(res, error);
    }
};

exports.updateClient = async (req, res) => {
    try {
        if (!hasValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        const { companyName, company, email, phone } = req.body;
        const targetCompany = (companyName || company || "").trim();
        const targetEmail = (email || "").toLowerCase().trim();
        const targetPhone = (phone || "").trim();

        // Duplicate Client Detection on Update (excluding current client)
        if (targetEmail) {
            const existingEmail = await Client.findOne({ email: targetEmail, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(409).json({ message: `Duplicate client detected: Another client already uses email '${targetEmail}'.` });
            }
        }
        if (targetCompany) {
            const existingCompany = await Client.findOne({
                _id: { $ne: req.params.id },
                $or: [{ companyName: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }, { company: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }]
            });
            if (existingCompany) {
                return res.status(409).json({ message: `Duplicate client detected: Another client already has company name '${targetCompany}'.` });
            }
        }
        if (targetPhone) {
            const existingPhone = await Client.findOne({ phone: targetPhone, _id: { $ne: req.params.id } });
            if (existingPhone) {
                return res.status(409).json({ message: `Duplicate client detected: Another client already uses phone '${targetPhone}'.` });
            }
        }

        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        if (!client) return res.status(404).json({ message: "Client not found" });
        return res.status(200).json(client);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate client detected: Record already exists." });
        }
        return sendError(res, error);
    }
};

exports.deleteClient = async (req, res) => {
    try {
        if (!hasValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid client ID" });
        }

        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });

        return res.status(200).json({ message: "Client deleted successfully", client });
    } catch (error) {
        return sendError(res, error);
    }
};
