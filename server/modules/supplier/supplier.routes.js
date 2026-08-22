const express = require("express");
const { authenticate, authorize } = require("../../middleware/auth");
const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require("./supplier.controller");

const router = express.Router();

// All authenticated users (Manager, Operations Officer, Accounts Officer, Staff, Client) can view suppliers
router.get("/", authenticate, getSuppliers);
router.get("/:id", authenticate, getSupplierById);

// ONLY Administrator can create, edit, or delete supplier master records
router.post("/", authenticate, authorize("admin"), createSupplier);
router.put("/:id", authenticate, authorize("admin"), updateSupplier);
router.delete("/:id", authenticate, authorize("admin"), deleteSupplier);

module.exports = router;
