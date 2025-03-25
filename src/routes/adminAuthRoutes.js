const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin");
const adminAuthController = require("../controllers/adminAuthController");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.get("/is-admin", isAdmin, adminAuthController.verifyAdminAuth);
router.post("/logout", adminAuthController.logoutAdmin);
router.post("/login", adminAuthController.loginAdmin);

module.exports = router;
