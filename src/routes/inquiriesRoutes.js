const express = require("express");
const router = express.Router();
const inquiriesController = require("../controllers/inquiriesController");
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");

//create inquiry
router.post("/", isAuthenticated, inquiriesController.createInquiry);

//get all inquiries
router.get("/", isAdmin, inquiriesController.getAllInquiries);

//get inquiry
router.get("/inquiry/:inquiryId", isAdmin, inquiriesController.getInquiry);

//route to delete inquiry
router.delete(
  "/:inquiryId",
  isAdmin,
  inquiriesController.deleteInquiry
);


module.exports = router;
