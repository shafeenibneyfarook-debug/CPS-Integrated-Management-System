const express = require("express");
const { authorize } = require("../../middleware/auth");
const controller = require("./purchaseOrder.controller");
const router = express.Router();

router.get("/", controller.getPurchaseOrders);
router.get("/:id", controller.getPurchaseOrderById);
router.post("/", authorize("admin", "operations_officer"), controller.createPurchaseOrder);
router.put("/:id", authorize("admin", "operations_officer"), controller.updatePurchaseOrder);
router.patch("/:id/approval", authorize("admin", "manager", "accounts_officer", "operations_officer", "supplier", "staff"), controller.updateApprovalStatus);
router.patch("/:id/supplier-accept", authorize("admin", "supplier"), controller.supplierAcceptPO);
router.patch("/:id/receiving", authorize("admin", "manager", "operations_officer", "supplier", "staff"), controller.updateReceiving);
router.delete("/:id", authorize("admin", "manager"), controller.deletePurchaseOrder);

module.exports = router;
