const Invoice = require("./invoice.model");
const Quotation = require("../quotation/quotation.model");
const Client = require("../client/client.model");
const Project = require("../project/project.model");
const User = require("../auth/user.model");
const EmailLog = require("./emailLog.model");
const { sendNotificationEmail, retryEmail } = require("./emailService");

// Generate unique invoice number: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${randomSuffix}`;
};

// 1. Create Invoice (Manager / Staff / Admin creation -> Pending Finance Verification)
exports.createInvoice = async (req, res) => {
    try {
        const { quotationId, clientId, projectId, items, taxRate, dueDate, notes } = req.body;

        let selectedClient = clientId;
        let invoiceItems = items;
        let refQuotation = null;

        if (quotationId) {
            refQuotation = await Quotation.findById(quotationId).populate("client");
            if (!refQuotation) return res.status(404).json({ message: "Quotation not found" });
            if (refQuotation.status !== "Approved") {
                return res.status(400).json({ message: "Invoices can only be created from Approved quotations" });
            }
            selectedClient = refQuotation.client._id || refQuotation.client;
            invoiceItems = refQuotation.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.total
            }));
        }

        const clientDoc = await Client.findById(selectedClient);
        if (!clientDoc) return res.status(404).json({ message: "Client reference not found" });

        // Resolve single Unified Head of Finance officer
        const accountsUser = await User.findOne({ role: "accounts_officer", isActive: true });

        const invoice = new Invoice({
            invoiceNumber: generateInvoiceNumber(),
            quotation: quotationId || null,
            client: selectedClient,
            project: projectId || null,
            items: invoiceItems,
            taxRate: taxRate || 0,
            dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // default 15 days
            notes: notes || "",
            financeVerificationStatus: "Pending Finance Verification",
            financeOfficer: accountsUser ? accountsUser._id : null,
            createdBy: req.user._id
        });

        await invoice.save();
        await invoice.populate("client project quotation financeOfficer");

        res.status(201).json({ message: "Invoice created and submitted for Accounts/Finance verification.", invoice });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to create invoice" });
    }
};

// 2. Finance / Accounts Officer Verifies Invoice -> Dispatches to Client Dashboard & Email
exports.verifyInvoiceByFinance = async (req, res) => {
    try {
        const { status = "Finance Verified" } = req.body;
        const invoice = await Invoice.findById(req.params.id).populate("client");
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        invoice.financeVerificationStatus = status;
        invoice.financeVerifiedBy = req.user._id;
        await invoice.save();

        if (status === "Finance Verified" && invoice.client?.email) {
            // Dispatch & Log Automated Email Notification
            await sendNotificationEmail({
                recipient: invoice.client.email,
                subject: `Official Verified Invoice Ready for Payment: ${invoice.invoiceNumber}`,
                emailType: "Invoice Generation",
                referenceId: invoice._id.toString(),
                referenceModel: "Invoice",
                bodyText: `Dear ${invoice.client.companyName || invoice.client.name}, Invoice ${invoice.invoiceNumber} for BDT ${invoice.totalAmount} has been verified by Accounts/Finance. Please visit your client dashboard to review and complete payment.`,
                userId: req.user._id
            });
        }

        res.json({ message: `Invoice finance status updated to "${status}". Verified invoice is now available on Client Dashboard for payment.`, invoice });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to verify invoice" });
    }
};

// 3. Get All Invoices (Clients see ONLY Finance Verified Invoices)
exports.getInvoices = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};

        if (status) filter.paymentStatus = status;

        // CLIENT ROLE RESTRICTION: Clients can ONLY see their own Finance Verified Invoices
        if (req.user.role === "client") {
            filter.financeVerificationStatus = "Finance Verified";
            const clientDoc = await Client.findOne({ email: req.user.email });
            if (clientDoc) {
                filter.client = clientDoc._id;
            }
        }

        let invoices = await Invoice.find(filter)
            .populate("client", "companyName name email phone")
            .populate("project", "projectName siteAddress")
            .populate("quotation", "quotationNumber title constructionSiteLocation")
            .populate("financeOfficer", "name email phone")
            .sort({ createdAt: -1 });

        if (search) {
            const query = search.toLowerCase();
            invoices = invoices.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(query) ||
                (inv.client?.companyName || inv.client?.name || "").toLowerCase().includes(query)
            );
        }

        res.json({ invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Get Single Invoice
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("client")
            .populate("project")
            .populate("quotation")
            .populate("payments.recordedBy", "name email");

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        res.json({ invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Record Payment (Full or Partial)
exports.recordPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, paymentDate, referenceNotes } = req.body;
        const invoice = await Invoice.findById(req.params.id).populate("client");

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        if (invoice.paymentStatus === "Paid") {
            return res.status(400).json({ message: "This invoice is already fully paid" });
        }

        const paymentAmt = Number(amount);
        if (isNaN(paymentAmt) || paymentAmt <= 0) {
            return res.status(400).json({ message: "Valid payment amount is required" });
        }

        if (paymentAmt > invoice.dueAmount) {
            return res.status(400).json({ message: `Payment amount cannot exceed remaining due amount of BDT ${invoice.dueAmount}` });
        }

        invoice.payments.push({
            amount: paymentAmt,
            paymentDate: paymentDate || new Date(),
            paymentMethod: paymentMethod || "Bank Transfer",
            referenceNotes: referenceNotes || "",
            recordedBy: req.user._id
        });

        await invoice.save();

        // When payment is recorded, transition linked Project from Pending to Running (Work Begins!)
        if (invoice.project) {
            const linkedProject = await Project.findById(invoice.project);
            if (linkedProject) {
                linkedProject.status = "Running";
                linkedProject.description = `Work Commenced: Client payment of BDT ${paymentAmt.toLocaleString()} received on Invoice ${invoice.invoiceNumber}. Site construction officially running.`;
                await linkedProject.save();
            }
        }

        if (invoice.quotation) {
            const projByQuote = await Project.findOne({ quotation: invoice.quotation });
            if (projByQuote) {
                projByQuote.status = "Running";
                projByQuote.description = `Work Commenced: Client payment of BDT ${paymentAmt.toLocaleString()} received on Invoice ${invoice.invoiceNumber}. Site construction officially running.`;
                await projByQuote.save();
            }
        }

        // Send payment confirmation email notification & log it
        if (invoice.client?.email) {
            await sendNotificationEmail({
                recipient: invoice.client.email,
                subject: `Payment Received for Invoice ${invoice.invoiceNumber} — Construction Work Commenced`,
                emailType: "Payment Reminder",
                referenceId: invoice._id.toString(),
                referenceModel: "Invoice",
                bodyText: `Payment of BDT ${paymentAmt.toLocaleString()} received. Status: ${invoice.paymentStatus}. Remaining Due: BDT ${invoice.dueAmount.toLocaleString()}. Construction work has officially begun!`,
                userId: req.user._id
            });
        }

        res.json({ message: "Payment recorded successfully. Project status updated to 'Running' (Work has begun)!", invoice });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 6. Send Payment Due / Overdue Reminder
exports.sendPaymentReminder = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate("client");
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== "Paid";
        const emailType = "Payment Reminder";
        const subject = isOverdue
            ? `OVERDUE NOTICE: Payment for Invoice ${invoice.invoiceNumber}`
            : `Payment Reminder: Invoice ${invoice.invoiceNumber}`;

        const log = await sendNotificationEmail({
            recipient: invoice.client?.email || req.body.recipientEmail,
            subject,
            emailType,
            referenceId: invoice._id.toString(),
            referenceModel: "Invoice",
            bodyText: `Reminder for Invoice ${invoice.invoiceNumber}. Outstanding balance: BDT ${invoice.dueAmount}. Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
            userId: req.user._id,
            forceFail: req.body.forceFail || false
        });

        res.json({ message: "Payment reminder dispatched", log });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. Get Email Logs (for Failed Email Tracking & Manual Follow-up)
exports.getEmailLogs = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) filter.status = status;

        const logs = await EmailLog.find(filter).sort({ createdAt: -1 }).limit(100);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. Retry Failed Email
exports.retryFailedEmail = async (req, res) => {
    try {
        const updatedLog = await retryEmail(req.params.logId);
        res.json({ message: "Email retried successfully", log: updatedLog });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 9. Finance Summary Dashboard Metrics
exports.getFinanceSummary = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "client") {
            filter.financeVerificationStatus = "Finance Verified";
            const clientDoc = await Client.findOne({ email: req.user.email });
            if (clientDoc) {
                filter.client = clientDoc._id;
            }
        }

        const invoices = await Invoice.find(filter);
        const now = new Date();

        let totalInvoiced = 0;
        let totalCollected = 0;
        let totalDue = 0;
        let overdueCount = 0;

        invoices.forEach(inv => {
            totalInvoiced += inv.totalAmount;
            totalCollected += inv.paidAmount;
            totalDue += inv.dueAmount;
            if (new Date(inv.dueDate) < now && inv.paymentStatus !== "Paid") {
                overdueCount += 1;
            }
        });

        res.json({
            summary: {
                totalInvoices: invoices.length,
                totalInvoiced: Number(totalInvoiced.toFixed(2)),
                totalCollected: Number(totalCollected.toFixed(2)),
                totalDue: Number(totalDue.toFixed(2)),
                overdueCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
