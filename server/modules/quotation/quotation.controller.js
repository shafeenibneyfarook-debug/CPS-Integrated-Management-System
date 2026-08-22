const mongoose = require("mongoose");
const Quotation = require("./quotation.model");
const Client = require("../client/client.model");
const Project = require("../project/project.model");
const Invoice = require("../invoice/invoice.model");
const User = require("../auth/user.model");

const editableStatuses = new Set(["Draft", "Rejected"]);
const transitions = {
    Draft: new Set(["Submitted"]),
    Submitted: new Set(["Draft", "Approved", "Rejected"]),
    Rejected: new Set(["Draft"]),
    Approved: new Set(),
    Revised: new Set()
};
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const errorResponse = (res, error) => {
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: "Validation failed", errors: Object.values(error.errors).map((item) => item.message) });
    }
    if (error.code === 11000) return res.status(409).json({ message: "Quotation number already exists" });
    return res.status(500).json({ message: "Internal server error" });
};
const nextNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;
    const latest = await Quotation.findOne({ quotationNumber: new RegExp(`^${prefix}`) }).sort({ quotationNumber: -1 }).select("quotationNumber").lean();
    const sequence = latest ? Number(latest.quotationNumber.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(sequence).padStart(4, "0")}`;
};
const populate = (query) => query.populate("client", "companyName contactPerson email phone").populate("createdBy", "name email").populate("items.supplier", "supplierName country productCategory");

exports.createQuotation = async (req, res) => {
    try {
        let clientId = req.body.client;

        if (req.user?.role === "client") {
            let clientDoc = await Client.findOne({ email: req.user.email });
            if (!clientDoc) {
                clientDoc = await Client.create({
                    companyName: req.user.name,
                    contactPerson: req.user.name,
                    email: req.user.email,
                    phone: req.user.phone || "000-000-0000",
                    address: "Registered Client Account",
                    clientType: "Corporate",
                    status: "Active"
                });
            }
            clientId = clientDoc._id;
        }

        if (!validId(clientId) || !await Client.exists({ _id: clientId })) return res.status(400).json({ message: "Select a valid client" });
        const quotation = await Quotation.create({ ...req.body, client: clientId, quotationNumber: await nextNumber(), status: "Draft", version: 1, createdBy: req.user._id });
        return res.status(201).json(await populate(Quotation.findById(quotation._id)));
    } catch (error) { return errorResponse(res, error); }
};

exports.getQuotations = async (req, res) => {
    try {
        const filter = {};
        if (req.user?.role === "client") {
            const clientDoc = await Client.findOne({ email: req.user.email });
            if (clientDoc) {
                filter.$or = [{ createdBy: req.user._id }, { client: clientDoc._id }];
            } else {
                filter.createdBy = req.user._id;
            }
        }
        if (req.query.status) filter.status = req.query.status;
        if (req.query.client && validId(req.query.client)) filter.client = req.query.client;
        if (req.query.search?.trim()) {
            const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(escaped, "i");
            const searchConditions = [{ quotationNumber: pattern }, { title: pattern }, { tenderReference: pattern }];
            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
                delete filter.$or;
            } else {
                filter.$or = searchConditions;
            }
        }
        return res.json(await populate(Quotation.find(filter).sort({ createdAt: -1 })));
    } catch (error) { return errorResponse(res, error); }
};

exports.getQuotationById = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await populate(Quotation.findById(req.params.id));
        if (!quotation) return res.status(404).json({ message: "Quotation not found" });
        return res.json(quotation);
    } catch (error) { return errorResponse(res, error); }
};

exports.updateQuotation = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found" });
        if (!editableStatuses.has(quotation.status)) return res.status(409).json({ message: `${quotation.status} quotations cannot be edited` });
        const allowed = [
            "title", "client", "tenderReference", "constructionSiteLocation", "validUntil", "currency", "items", "taxRate", "notes",
            "approximateAreaSqFt", "numberOfFloors", "projectType", "materialQuality", "labourCategory", "tierOptions", "selectedTier"
        ];
        allowed.forEach((field) => { if (req.body[field] !== undefined) quotation[field] = req.body[field]; });
        if (!validId(quotation.client) || !await Client.exists({ _id: quotation.client })) return res.status(400).json({ message: "Select a valid client" });
        await quotation.save();
        return res.json(await populate(Quotation.findById(quotation._id)));
    } catch (error) { return errorResponse(res, error); }
};

exports.updateStatus = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found" });
        const nextStatus = req.body.status;
        if (!transitions[quotation.status]?.has(nextStatus)) return res.status(409).json({ message: `Cannot change status from ${quotation.status} to ${nextStatus}` });

        if (req.user?.role === "client") {
            const clientDoc = await Client.findOne({ email: req.user.email });
            const isOwner = quotation.createdBy?.equals(req.user._id) || (clientDoc && quotation.client?.equals(clientDoc._id));
            if (!isOwner) {
                return res.status(403).json({ message: "You can only respond to estimation proposals assigned to your account." });
            }
        }

        quotation.status = nextStatus;
        if (req.body.rejectionReason !== undefined) {
            quotation.rejectionReason = req.body.rejectionReason;
        }
        await quotation.save();
        return res.json(await populate(Quotation.findById(quotation._id)));
    } catch (error) { return errorResponse(res, error); }
};

// Admin Verifies Manager Proposal Offer before it is presented to Client
exports.adminVerifyProposal = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation proposal offer not found" });

        const { status = "Admin Verified" } = req.body;
        quotation.adminVerificationStatus = status;
        quotation.adminVerifiedBy = req.user._id;
        quotation.adminVerifiedAt = new Date();

        if (status === "Admin Verified") {
            quotation.status = "Submitted";
        } else if (status === "Admin Rejected") {
            quotation.status = "Rejected";
        }

        await quotation.save();
        return res.json(await populate(Quotation.findById(quotation._id)));
    } catch (error) { return errorResponse(res, error); }
};

// Client Accepts one of 3 price options or Rejects all of them
exports.clientDecideProposal = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation proposal offer not found" });

        if (quotation.adminVerificationStatus !== "Admin Verified") {
            return res.status(400).json({ message: "Proposal offer must be verified by Admin before client decision." });
        }

        const { decision, notes, selectedTier } = req.body;
        quotation.clientDecision = decision;
        quotation.clientDecisionNotes = notes || "";
        quotation.clientDecidedAt = new Date();

        if (decision === "Accepted") {
            quotation.status = "Approved";
            if (selectedTier) {
                quotation.selectedTier = selectedTier;
                if (quotation.tierOptions && quotation.tierOptions[selectedTier]) {
                    const chosen = quotation.tierOptions[selectedTier];
                    if (chosen.totalCostBDT) quotation.total = chosen.totalCostBDT;
                    if (chosen.items && chosen.items.length > 0) quotation.items = chosen.items;
                }
            }

            // Sync / Auto-create Project in "Pending" status (waiting for payment before work begins)
            let clientName = req.user?.name || "Client";
            if (quotation.client) {
                const cDoc = await Client.findById(quotation.client);
                if (cDoc) {
                    clientName = cDoc.companyName || cDoc.contactPerson || cDoc.name || clientName;
                }
            }

            const startDate = new Date();
            const deadline = new Date();
            deadline.setMonth(deadline.getMonth() + 6);

            const titleToMatch = (quotation.title || "").trim();
            let project = await Project.findOne({
                $or: [
                    { quotation: quotation._id },
                    { projectName: new RegExp(`^${titleToMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
                ]
            });

            if (!project) {
                project = await Project.create({
                    projectName: quotation.title || `Construction Project (${quotation.quotationNumber})`,
                    clientName: clientName,
                    startDate: startDate,
                    deadline: deadline,
                    budget: quotation.total || 0,
                    projectLocation: quotation.constructionSiteLocation || "Dhaka Site",
                    status: "Pending",
                    description: `Proposal accepted by client (${quotation.selectedTier ? quotation.selectedTier.toUpperCase() + ' Tier' : 'Standard Tier'}). Awaiting Finance invoice verification & client payment before site construction begins.`,
                    quotation: quotation._id,
                    client: quotation.client,
                    createdBy: req.user._id
                });
            } else {
                project.quotation = quotation._id;
                project.client = quotation.client || project.client;
                project.budget = quotation.total || project.budget;
                project.projectLocation = quotation.constructionSiteLocation || project.projectLocation;
                project.status = "Pending";
                await project.save();
            }

            // Automatically Generate Invoice submitted for Finance Verification & Approval
            let invoice = await Invoice.findOne({ quotation: quotation._id });
            if (!invoice) {
                const accountsUser = await User.findOne({ role: "accounts_officer", isActive: true });
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

                const invoiceItems = (quotation.items && quotation.items.length > 0)
                    ? quotation.items.map(i => ({
                        description: i.description || "Construction Building Works",
                        quantity: i.quantity || 1,
                        unitPrice: i.unitPrice || quotation.total || 0,
                        total: i.total || (i.quantity * i.unitPrice) || quotation.total || 0
                    }))
                    : [{
                        description: `${quotation.title} (${quotation.selectedTier ? quotation.selectedTier.toUpperCase() + ' Plan' : 'Construction Works'})`,
                        quantity: 1,
                        unitPrice: quotation.total || 0,
                        total: quotation.total || 0
                    }];

                invoice = await Invoice.create({
                    invoiceNumber,
                    quotation: quotation._id,
                    client: quotation.client,
                    project: project._id,
                    items: invoiceItems,
                    taxRate: quotation.taxRate || 0,
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                    notes: `Official Invoice generated from accepted proposal ${quotation.quotationNumber} (${quotation.selectedTier ? quotation.selectedTier.toUpperCase() + ' Plan' : 'Standard'}). Submitted to Accounts/Finance for approval.`,
                    financeVerificationStatus: "Pending Finance Verification",
                    financeOfficer: accountsUser ? accountsUser._id : null,
                    createdBy: req.user._id
                });
            }
        } else if (decision === "Rejected") {
            quotation.status = "Rejected";
            quotation.selectedTier = null;
            quotation.rejectionReason = notes || "Client declined all proposal price options";
        }

        await quotation.save();
        return res.json(await populate(Quotation.findById(quotation._id)));
    } catch (error) { return errorResponse(res, error); }
};

exports.reviseQuotation = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const source = await Quotation.findById(req.params.id);
        if (!source) return res.status(404).json({ message: "Quotation not found" });
        if (source.status !== "Approved") return res.status(409).json({ message: "Only approved quotations can be revised" });
        const root = source.rootQuotation || source._id;
        const latest = await Quotation.findOne({ $or: [{ _id: root }, { rootQuotation: root }] }).sort({ version: -1 });
        source.status = "Revised";
        await source.save();
        const copy = source.toObject();
        ["_id", "createdAt", "updatedAt", "__v"].forEach((field) => delete copy[field]);
        const revision = await Quotation.create({ ...copy, quotationNumber: await nextNumber(), status: "Draft", version: latest.version + 1, rootQuotation: root, revisedFrom: source._id, createdBy: req.user._id });
        return res.status(201).json(await populate(Quotation.findById(revision._id)));
    } catch (error) { return errorResponse(res, error); }
};

exports.deleteQuotation = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quotation ID" });
        const quotation = await Quotation.findById(req.params.id);
        if (!quotation) return res.status(404).json({ message: "Quotation not found" });
        if (quotation.status !== "Draft") return res.status(409).json({ message: "Only draft quotations can be deleted" });
        await quotation.deleteOne();
        return res.json({ message: "Quotation deleted successfully" });
    } catch (error) { return errorResponse(res, error); }
};
