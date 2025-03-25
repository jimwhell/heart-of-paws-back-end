const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");

router.post("/getUsers", userController.getUsers);

//route to get user profile
router.get("/:id", isAuthenticated, userController.getUserProfile);
router.patch(
  "/:id/profile-image",
  isAuthenticated,
  userController.uploadProfileImage,
  userController.updateProfileImage
);

//route to get all users
router.get("/", isAdmin, userController.getAllUsers);

//route to get a specific user
router.get("/user/:userId", isAdmin, userController.getUserWithApplications);

//route for search

module.exports = router;
