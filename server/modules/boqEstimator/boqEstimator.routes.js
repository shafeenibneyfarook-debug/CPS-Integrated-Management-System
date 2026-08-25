const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middleware/auth");
const boqEstimatorController = require("./boqEstimator.controller");

// All authenticated roles (Client, Manager, Admin, Accounts Officer, Operations Officer, Staff, Supplier) can calculate & view BOQ estimates
router.post("/calculate", authenticate, boqEstimatorController.calculateEstimate);
router.post("/save", authenticate, boqEstimatorController.saveEstimate);
router.get("/records", authenticate, boqEstimatorController.getEstimates);

module.exports = router;
