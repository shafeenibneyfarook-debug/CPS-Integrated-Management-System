const express = require("express");
const { authorize } = require("../../middleware/auth");
const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    updateProjectProgress,
    approveManager,
    approveFinance
} = require("./project.controller");

const router = express.Router();

// Read routes accessible to authenticated users
router.get("/", getProjects);
router.get("/:id", getProjectById);

// Progress & Delay updates (Logistics / Operations Officer ONLY)
router.post("/:id/progress", authorize("admin", "operations_officer"), updateProjectProgress);

// Workflow Approvals
router.post("/:id/approve-manager", authorize("admin", "manager"), approveManager);
router.post("/:id/approve-finance", authorize("admin", "accounts_officer"), approveFinance);

// Create, Update, Delete restricted to internal operations staff, managers, and admins (clients are read-only)
router.post("/", authorize("admin", "manager", "operations_officer", "staff"), createProject);
router.put("/:id", authorize("admin", "manager", "operations_officer", "staff"), updateProject);
router.delete("/:id", authorize("admin", "manager"), deleteProject);

module.exports = router;
