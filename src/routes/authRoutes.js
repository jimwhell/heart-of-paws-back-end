const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");

//route to verify user authentication status
router.get("/is-authenticated", isAuthenticated, authController.verifyAuth);
router.get("/verify-email", authController.verifyEmail);

//route to verify admin authentication status

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logout);

module.exports = router;
