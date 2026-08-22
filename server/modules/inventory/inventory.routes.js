const express = require("express");
const router = express.Router();
const inventoryController = require("./inventory.controller");

router.get("/alerts", inventoryController.getLowStockAlerts);
router.get("/movements", inventoryController.getMovements);
router.post("/movements", inventoryController.recordMovement);

router.get("/", inventoryController.getItems);
router.post("/", inventoryController.createItem);

module.exports = router;
