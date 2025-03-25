const express = require("express");
const router = express.Router();
const applicationsController = require("../controllers/applicationsController");
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");

//user routes
//create application to adopt a rescue
router.post(
  "/inquire/:slug",
  isAuthenticated,
  applicationsController.createApplication
);
// router.get('/')
//delete application to adopt a rescue
router.delete(
  "/:id",
  isAuthenticated,
  applicationsController.deleteApplication
);
//get all available dates
router.get(
  "/available-dates",
  isAuthenticated,
  applicationsController.getAvailableDates
);

router.post("/searchApplications", applicationsController.searchApplications);

//get all applications
router.get("/", applicationsController.getAllApplications);
//admin routes
// get all applications for rescue
router.get("/:slug", isAdmin, applicationsController.getApplicationsForRescue);

//get user by applicationId
router.get("/:applicationId/user", applicationsController.getUserByApplication);

module.exports = router;
