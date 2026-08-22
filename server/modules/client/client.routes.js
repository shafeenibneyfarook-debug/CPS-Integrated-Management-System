const express = require("express");
const { authenticate, authorize } = require("../../middleware/auth");
const {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient
} = require("./client.controller");

const router = express.Router();

// All authenticated users (Manager, Operations Officer, Accounts Officer, Staff, Client) can view clients
router.get("/", authenticate, getClients);
router.get("/:id", authenticate, getClientById);

// ONLY Administrator can create, edit, or delete client master records
router.post("/", authenticate, authorize("admin"), createClient);
router.put("/:id", authenticate, authorize("admin"), updateClient);
router.delete("/:id", authenticate, authorize("admin"), deleteClient);

module.exports = router;
