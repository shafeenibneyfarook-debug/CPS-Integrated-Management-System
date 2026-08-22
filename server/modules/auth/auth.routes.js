const express = require("express");
const controller = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");

const router = express.Router();
router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", authenticate, controller.me);
router.put("/profile", authenticate, controller.updateProfile);
module.exports = router;
