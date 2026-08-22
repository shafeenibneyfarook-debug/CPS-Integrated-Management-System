const express = require("express");
const router = express.Router();
const productRecController = require("./productRecommendation.controller");

router.get("/recommendations", productRecController.getRecommendations);
router.post("/alerts", productRecController.subscribePriceAlert);
router.get("/alerts", productRecController.getPriceAlerts);

module.exports = router;
