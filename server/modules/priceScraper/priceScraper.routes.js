const express = require("express");
const router = express.Router();
const priceScraperController = require("./priceScraper.controller");
const { authenticate, authorize } = require("../../middleware/auth");

// All authenticated users can view scraped price records
router.get("/", authenticate, priceScraperController.getScrapedPrices);

// ONLY Administrator can trigger live web scraping
router.post("/trigger", authenticate, authorize("admin"), priceScraperController.triggerScraper);

// Admin & Supplier review item verification status
router.put("/:id/review", authenticate, authorize("admin", "supplier"), priceScraperController.reviewPriceRecord);

// Supplier submits available material supply quantity
router.put("/:id/supplier-quantity", authenticate, authorize("admin", "supplier"), priceScraperController.submitSupplierQuantity);

// Logistics / Operations Officer verifies supplier quantity
router.put("/:id/verify-quantity", authenticate, authorize("admin", "operations_officer", "staff"), priceScraperController.verifyLogisticsQuantity);

// Only Admin can delete duplicate or invalid price records
router.delete("/:id", authenticate, authorize("admin"), priceScraperController.deletePriceRecord);

module.exports = router;
