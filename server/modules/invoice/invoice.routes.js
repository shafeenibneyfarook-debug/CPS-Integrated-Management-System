const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../../middleware/auth");
const invoiceController = require("./invoice.controller");

router.get("/summary", authenticate, invoiceController.getFinanceSummary);
router.get("/email-logs", authenticate, invoiceController.getEmailLogs);
router.post("/email-logs/:logId/retry", authenticate, invoiceController.retryFailedEmail);

router.post("/", authenticate, authorize("admin", "manager", "staff"), invoiceController.createInvoice);
router.get("/", authenticate, invoiceController.getInvoices);
router.get("/:id", authenticate, invoiceController.getInvoiceById);

// Finance / Accounts Officer Verifies Invoice
router.put("/:id/verify-finance", authenticate, authorize("admin", "accounts_officer"), invoiceController.verifyInvoiceByFinance);

router.post("/:id/payments", authenticate, invoiceController.recordPayment);
router.post("/:id/reminder", authenticate, invoiceController.sendPaymentReminder);

module.exports = router;
