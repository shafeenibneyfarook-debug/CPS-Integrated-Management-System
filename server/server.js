// ======================================================
// CPS MANAGEMENT SYSTEM - BACKEND SERVER
// ======================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// ======================================================
// IMPORT ALL ROUTES
// ======================================================
const authRoutes = require("./modules/auth/auth.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const clientRoutes = require("./modules/client/client.routes");
const supplierRoutes = require("./modules/supplier/supplier.routes");
const projectRoutes = require("./modules/project/project.routes");
const shipmentRoutes = require("./modules/shipment/shipment.routes");
const quotationRoutes = require("./modules/quotation/quotation.routes");
const purchaseOrderRoutes = require("./modules/purchaseOrder/purchaseOrder.routes");

// Module 3 Routes
const invoiceRoutes = require("./modules/invoice/invoice.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const importCostRoutes = require("./modules/importCost/importCost.routes");
const priceScraperRoutes = require("./modules/priceScraper/priceScraper.routes");
const boqEstimatorRoutes = require("./modules/boqEstimator/boqEstimator.routes");
const productRecommendationRoutes = require("./modules/productRecommendation/productRecommendation.routes");

const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

// Authentication Middleware
const { authenticate } = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ======================================================
// API ROUTES
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clients", authenticate, clientRoutes);
app.use("/api/suppliers", authenticate, supplierRoutes);
app.use("/api/projects", authenticate, projectRoutes);
app.use("/api/shipments", authenticate, shipmentRoutes);
app.use("/api/quotations", authenticate, quotationRoutes);
app.use("/api/purchase-orders", authenticate, purchaseOrderRoutes);

// Module 3 Features
app.use("/api/invoices", authenticate, invoiceRoutes);
app.use("/api/inventory", authenticate, inventoryRoutes);
app.use("/api/import-costs", authenticate, importCostRoutes);
app.use("/api/price-scraper", authenticate, priceScraperRoutes);
app.use("/api/boq-estimator", authenticate, boqEstimatorRoutes);
app.use("/api/product-recommendations", authenticate, productRecommendationRoutes);

app.use("/api/dashboard", authenticate, dashboardRoutes);

// Health Check
app.get("/", (req, res) => {
    res.send("CPS Management System Backend Running");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.name,
        databaseState: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
