// ======================================================
// CPS MANAGEMENT SYSTEM - EXPRESS APP CONFIGURATION
// ======================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// ======================================================
// IMPORT ALL MODULE ROUTES
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

// Enable CORS for all origins & headers
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Normalize Vercel serverless request path if needed
app.use((req, res, next) => {
    if (req.url.startsWith("/api/index.js")) {
        req.url = req.url.replace(/^\/api\/index\.js/, "") || "/";
    }
    next();
});

// Serverless DB connection middleware (ensures DB is connected before processing requests)
app.use(async (req, res, next) => {
    // Skip DB connection for basic status check
    if (req.path === "/health" || req.path === "/api/health") {
        return next();
    }

    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("DB connection error:", err.message);
        return res.status(500).json({
            message: "Database connection failed. Please ensure MONGO_URI is set in Vercel environment variables and MongoDB Atlas allows connections from all IP addresses (0.0.0.0/0).",
            error: err.message
        });
    }
});

// ======================================================
// API ROUTER (Mounts all endpoints)
// ======================================================
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/clients", authenticate, clientRoutes);
apiRouter.use("/suppliers", authenticate, supplierRoutes);
apiRouter.use("/projects", authenticate, projectRoutes);
apiRouter.use("/shipments", authenticate, shipmentRoutes);
apiRouter.use("/quotations", authenticate, quotationRoutes);
apiRouter.use("/purchase-orders", authenticate, purchaseOrderRoutes);

// Module 3 Features
apiRouter.use("/invoices", authenticate, invoiceRoutes);
apiRouter.use("/inventory", authenticate, inventoryRoutes);
apiRouter.use("/import-costs", authenticate, importCostRoutes);
apiRouter.use("/price-scraper", authenticate, priceScraperRoutes);
apiRouter.use("/boq-estimator", authenticate, boqEstimatorRoutes);
apiRouter.use("/product-recommendations", authenticate, productRecommendationRoutes);

apiRouter.use("/dashboard", authenticate, dashboardRoutes);

// Health Check
apiRouter.get("/health", async (req, res) => {
    let userCount = 0;
    try {
        const User = mongoose.models.User;
        if (User && mongoose.connection.readyState === 1) {
            userCount = await User.countDocuments();
        }
    } catch (_) { /* ignore */ }

    const uri = process.env.MONGO_URI || "";
    res.json({
        status: "ok",
        service: "CPS Management System API",
        dbState: mongoose.connection.readyState,
        databaseName: mongoose.connection.name || "none",
        dbHost: mongoose.connection.host || "none",
        userCount,
        hasMongoUri: !!process.env.MONGO_URI,
        uriContainsDbName: uri.includes("/cps_management"),
        timestamp: new Date().toISOString()
    });
});

// Mount router on BOTH /api and root / (works with or without /api prefix on Vercel)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handler Middleware (ensures JSON responses instead of HTML 500 errors)
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).json({
        message: err.message || "An unexpected server error occurred. Please try again.",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

module.exports = app;
