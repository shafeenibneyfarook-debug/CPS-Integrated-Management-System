const express = require("express");
const controller = require("./admin.controller");
const { authenticate, authorize } = require("../../middleware/auth");

const router = express.Router();
router.use(authenticate, authorize("admin"));
router.get("/users", controller.listUsers);
router.patch("/users/:id", controller.updateUser);
module.exports = router;
