const express = require("express");
const { authenticate, authorize } = require("../../middleware/auth");
const controller = require("./quotation.controller");
const router = express.Router();

router.get("/", authenticate, controller.getQuotations);
router.get("/:id", authenticate, controller.getQuotationById);
router.post("/", authenticate, authorize("admin", "manager", "staff", "client"), controller.createQuotation);
router.put("/:id", authenticate, authorize("admin", "manager", "staff"), controller.updateQuotation);

// Admin verifies Manager proposal bid
router.put("/:id/admin-verify", authenticate, authorize("admin"), controller.adminVerifyProposal);

// Client accepts or rejects Admin-verified proposal offer
router.put("/:id/client-decision", authenticate, authorize("client"), controller.clientDecideProposal);

router.patch("/:id/status", authenticate, authorize("admin", "manager", "client"), controller.updateStatus);
router.post("/:id/revisions", authenticate, authorize("admin", "manager"), controller.reviseQuotation);
router.delete("/:id", authenticate, authorize("admin", "manager"), controller.deleteQuotation);

module.exports = router;
