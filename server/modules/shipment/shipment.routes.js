const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../../middleware/auth");
const {
    createShipment,
    getShipments,
    getShipmentById,
    updateShipment,
    deleteShipment
} = require("./shipment.controller");

// 1. Get All Shipments (Accessible to all authenticated users for live tracking)
router.get("/", authenticate, getShipments);

// 2. Get Single Shipment
router.get("/:id", authenticate, getShipmentById);

// 3. Create Shipment (Initiated strictly by Supplier and Admin)
router.post("/", authenticate, authorize("admin", "supplier"), createShipment);

// 4. Update Shipment / Logistics Status (Strictly allowed for Supplier, Operations Officer and Admin)
router.put("/:id", authenticate, authorize("admin", "supplier", "operations_officer", "staff"), updateShipment);
router.patch("/:id", authenticate, authorize("admin", "supplier", "operations_officer", "staff"), updateShipment);

// 5. Delete Shipment (Admin and Operations Officer)
router.delete("/:id", authenticate, authorize("admin", "operations_officer"), deleteShipment);

module.exports = router;