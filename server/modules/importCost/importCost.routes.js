const express = require("express");
const router = express.Router();
const importCostController = require("./importCost.controller");
const { authenticate, authorize } = require("../../middleware/auth");

router.use(authenticate);

router.get("/rates", importCostController.getRates);
router.post("/calculate", importCostController.calculateImportCost);
router.get("/records", importCostController.getImportRecords);
router.put("/:id/verify-manager", authorize("admin", "manager"), importCostController.verifyImportOrderManager);
router.put("/:id/verify-finance", authorize("admin", "accounts_officer"), importCostController.verifyImportOrderFinance);
router.put("/:id/status", authorize("admin", "manager", "operations_officer", "staff", "supplier"), importCostController.updateImportOrderStatus);
router.put("/:id/receive", authorize("admin", "manager", "operations_officer", "staff", "supplier"), importCostController.receiveImportIntoInventory);

module.exports = router;

