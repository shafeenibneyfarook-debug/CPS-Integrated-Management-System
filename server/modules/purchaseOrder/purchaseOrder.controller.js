const mongoose = require("mongoose");
const PurchaseOrder = require("./purchaseOrder.model");
const Supplier = require("../supplier/supplier.model");
const Client = require("../client/client.model");
const Invoice = require("../invoice/invoice.model");
const { sendNotificationEmail } = require("../invoice/emailService");

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const editable = new Set(["Draft", "Pending Manager Approval", "Rejected"]);
const transitions = {
    Draft: new Set(["Pending Manager Approval"]),
    "Pending Manager Approval": new Set(["Draft", "Manager Approved", "Approved", "Rejected"]),
    "Manager Approved": new Set(["Approved", "Rejected"]),
    Rejected: new Set(["Draft", "Pending Manager Approval"]),
    Approved: new Set()
};
const sendError = (res, error) => {
    if (error.name === "ValidationError") return res.status(400).json({ message: "Validation failed", errors: Object.values(error.errors).map((item) => item.message) });
    if (error.code === 11000) return res.status(409).json({ message: "Purchase order number already exists" });
    return res.status(500).json({ message: "Internal server error" });
};
const populate = (query) => query
    .populate("supplier", "supplierName contactPerson email")
    .populate("acceptedSupplier", "supplierName country contactPerson email")
    .populate("createdBy approvedBy managerApprovedBy financeApprovedBy", "name email role");

const nextNumber = async () => {
    const year = new Date().getFullYear(), prefix = `PO-${year}-`;
    const last = await PurchaseOrder.findOne({ purchaseOrderNumber: new RegExp(`^${prefix}`) }).sort({ purchaseOrderNumber: -1 }).select("purchaseOrderNumber").lean();
    return `${prefix}${String(last ? Number(last.purchaseOrderNumber.slice(prefix.length)) + 1 : 1).padStart(4, "0")}`;
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "admin" && userRole !== "operations_officer") {
            return res.status(403).json({ message: "Access Denied: Only Logistics & Operations Officers can request purchase orders." });
        }

        if (!validId(req.body.supplier) || !await Supplier.exists({ _id: req.body.supplier })) return res.status(400).json({ message: "Select a valid supplier" });
        if (new Date(req.body.expectedDelivery) < new Date(req.body.orderDate)) return res.status(400).json({ message: "Expected delivery cannot be before the order date" });
        
        const initialStatus = "Pending Manager Approval";
        const order = await PurchaseOrder.create({
            ...req.body,
            purchaseOrderNumber: await nextNumber(),
            approvalStatus: req.body.approvalStatus || initialStatus,
            receivingStatus: "Not Received",
            createdBy: req.user._id
        });
        return res.status(201).json(await populate(PurchaseOrder.findById(order._id)));
    } catch (error) { return sendError(res, error); }
};

exports.getPurchaseOrders = async (req, res) => {
    try {
        const filter = {};
        if (req.user?.role === "supplier") {
            const supplierDoc = await Supplier.findOne({ email: req.user.email });
            if (supplierDoc) {
                filter.$or = [{ supplier: supplierDoc._id }, { acceptedSupplier: supplierDoc._id }, { approvalStatus: "Approved" }];
            }
        } else if (req.query.supplier && validId(req.query.supplier)) {
            filter.supplier = req.query.supplier;
        }

        if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
        if (req.query.receivingStatus) filter.receivingStatus = req.query.receivingStatus;
        if (req.query.search?.trim()) {
            const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [{ purchaseOrderNumber: new RegExp(escaped, "i") }, { title: new RegExp(escaped, "i") }];
        }
        return res.json(await populate(PurchaseOrder.find(filter).sort({ createdAt: -1 })));
    } catch (error) { return sendError(res, error); }
};

exports.getPurchaseOrderById = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await populate(PurchaseOrder.findById(req.params.id));
        if (!order) return res.status(404).json({ message: "Purchase order not found" });
        return res.json(order);
    } catch (error) { return sendError(res, error); }
};

exports.updatePurchaseOrder = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Purchase order not found" });
        if (!editable.has(order.approvalStatus)) return res.status(409).json({ message: `${order.approvalStatus} purchase orders cannot be edited` });
        const fields = ["title", "supplier", "orderDate", "expectedDelivery", "currency", "items", "taxRate", "notes"];
        fields.forEach((field) => { if (req.body[field] !== undefined) order[field] = req.body[field]; });
        if (!validId(order.supplier) || !await Supplier.exists({ _id: order.supplier })) return res.status(400).json({ message: "Select a valid supplier" });
        if (new Date(order.expectedDelivery) < new Date(order.orderDate)) return res.status(400).json({ message: "Expected delivery cannot be before the order date" });
        await order.save();
        return res.json(await populate(PurchaseOrder.findById(order._id)));
    } catch (error) { return sendError(res, error); }
};

exports.updateApprovalStatus = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Purchase order not found" });
        
        const newStatus = req.body.approvalStatus;

        if (newStatus === "Manager Approved" && !["admin", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Only a manager or admin can give Manager Approval for a purchase order." });
        }
        if (newStatus === "Approved" && !["admin", "accounts_officer", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Only finance accounts officer or admin can give final Approval and generate invoices." });
        }

        order.approvalStatus = newStatus;

        if (newStatus === "Manager Approved") {
            order.managerApprovedBy = req.user._id;
            order.managerApprovedAt = new Date();
        } else if (newStatus === "Approved") {
            order.financeApprovedBy = req.user._id;
            order.financeApprovedAt = new Date();
            order.approvedBy = req.user._id;
            order.approvedAt = new Date();

            // Auto-Generate Invoice for Client/Project upon Finance Approval
            let clientRef = order.client;
            if (!clientRef) {
                const firstClient = await Client.findOne({}).select("_id");
                if (firstClient) clientRef = firstClient._id;
            }

            if (clientRef) {
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);

                const invoiceItems = order.items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total
                }));

                await Invoice.create({
                    invoiceNumber,
                    client: clientRef,
                    project: order.project || null,
                    items: invoiceItems,
                    subtotal: order.subtotal,
                    taxRate: order.taxRate || 0,
                    taxAmount: order.taxAmount || 0,
                    totalAmount: order.total,
                    paidAmount: 0,
                    dueAmount: order.total,
                    paymentStatus: "Unpaid",
                    financeVerificationStatus: "Finance Verified",
                    financeVerifiedBy: req.user._id,
                    dueDate: dueDate,
                    notes: `Generated from Approved Purchase Order ${order.purchaseOrderNumber}`,
                    createdBy: req.user._id
                });
            }

            // Notify Supplier about Approved PO
            if (order.supplier) {
                const supplierDoc = await Supplier.findById(order.supplier);
                if (supplierDoc?.email) {
                    await sendNotificationEmail({
                        recipient: supplierDoc.email,
                        subject: `📦 [PO Approved] Purchase Order ${order.purchaseOrderNumber} Approved for Delivery`,
                        emailType: "Custom Alert",
                        referenceId: order._id.toString(),
                        referenceModel: "PurchaseOrder",
                        bodyText: `Dear ${supplierDoc.supplierName || 'Supplier Partner'},

Great news! Purchase Order ${order.purchaseOrderNumber} ("${order.title}") has completed manager and finance approvals.

• Order Date: ${new Date(order.orderDate).toLocaleDateString()}
• Target Delivery Date: ${new Date(order.expectedDelivery).toLocaleDateString()}
• Total Order Value: ${order.total.toFixed(2)} ${order.currency}

Please log into your supplier portal to accept the order request and update delivered stock quantities as shipments arrive.`,
                        userId: req.user._id
                    });
                }
            }
        } else if (newStatus === "Rejected") {
            order.approvedBy = null;
            order.approvedAt = null;
        }

        await order.save();
        return res.json(await populate(PurchaseOrder.findById(order._id)));
    } catch (error) { return sendError(res, error); }
};

exports.supplierAcceptPO = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Purchase order not found" });

        let supplierDoc = await Supplier.findOne({ email: req.user.email });
        if (!supplierDoc && (req.user.role === "supplier" || req.user.role === "admin")) {
            supplierDoc = await Supplier.create({
                supplierName: req.user.name || "Supplier Partner",
                contactPerson: req.user.name || "Supplier Representative",
                email: req.user.email,
                phone: req.user.phone || "+8801700000000",
                address: "Dhaka, Bangladesh",
                materialCategories: ["General", "Cement & Concrete", "Steel & Rod"],
                createdBy: req.user._id
            });
        }

        const status = req.body.supplierAcceptanceStatus || "Accepted";

        order.supplierAcceptanceStatus = status;
        if (supplierDoc) {
            order.acceptedSupplier = supplierDoc._id;
            order.supplier = supplierDoc._id;
        }
        order.acceptedAt = new Date();
        await order.save();

        return res.json(await populate(PurchaseOrder.findById(order._id)));
    } catch (error) { return sendError(res, error); }
};

exports.updateReceiving = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Purchase order not found" });
        if (order.approvalStatus !== "Approved") return res.status(409).json({ message: "A purchase order must be approved before receiving items" });
        if (!Array.isArray(req.body.items)) return res.status(400).json({ message: "Receiving quantities are required" });
        const quantities = new Map(req.body.items.map((item) => [String(item._id), Number(item.receivedQuantity)]));
        for (const item of order.items) {
            if (quantities.has(String(item._id))) item.receivedQuantity = quantities.get(String(item._id));
        }
        const received = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
        const ordered = order.items.reduce((sum, item) => sum + item.quantity, 0);
        order.receivingStatus = received === 0 ? "Not Received" : received >= ordered ? "Received" : "Partially Received";
        await order.save();
        return res.json(await populate(PurchaseOrder.findById(order._id)));
    } catch (error) { return sendError(res, error); }
};

exports.deletePurchaseOrder = async (req, res) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid purchase order ID" });
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Purchase order not found" });
        if (order.approvalStatus !== "Draft" && order.approvalStatus !== "Pending Manager Approval") {
            return res.status(409).json({ message: "Only draft or pending purchase orders can be deleted" });
        }
        await order.deleteOne();
        return res.json({ message: "Purchase order deleted successfully" });
    } catch (error) { return sendError(res, error); }
};
