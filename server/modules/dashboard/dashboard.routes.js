// Import express

const express = require("express");




// Import dashboard controller functions

const {


    getDashboardStats,

    getRecentActivities


} = require("./dashboard.controller");





// Create router

const router = express.Router();







// ==========================================
// DASHBOARD ROUTES
// ==========================================





// Get dashboard statistics
//
// URL:
// GET /api/dashboard
//
// Returns:
// totalClients
// totalProjects
// totalSuppliers
// activeProjects


router.get("/", getDashboardStats);







// Get recent activities
//
// URL:
// GET /api/dashboard/activities
//
// Returns:
// latest clients
// latest projects
// latest suppliers


router.get("/activities", getRecentActivities);







// Export router

module.exports = router;