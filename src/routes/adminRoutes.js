const express = require("express");
const router = express.Router();
const Applications = require("../models/application");
const isAdmin = require("../middlewares/isAdmin");
const adminController = require("../controllers/adminController");

//approve or reject an application
router.patch(
  "/applications/:applicationId/status",
  adminController.approveOrRejectApplication
);

//respond to inquiry
router.post(
  "/inquiries/inquiry/:inquiryId",
  isAdmin,
  adminController.respondToInquiry
);

module.exports = router;
