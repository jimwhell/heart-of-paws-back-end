const express = require("express");
const router = express.Router();
const rescuesController = require("../controllers/rescuesController");
const isAuthenticated = require("../middlewares/isAuthenticated");
const isAdmin = require("../middlewares/isAdmin");

//public routes
//route to fetch all rescues
router.get("/", rescuesController.getAllRescues);
//fetch single rescue
router.get("/:slug", rescuesController.getRescue);
//fetch rescue by filter

//fetch rescues by size
router.post("/searchRescues", rescuesController.searchRescues);


//admin routes
//create rescue
router.post(
  "/createRescue",
  isAdmin,
  rescuesController.uploadImages,
  rescuesController.createRescue
);
//get total no of applications for rescue
router.get(
  "/:slug/applications",
  isAdmin,
  rescuesController.getNoOfApplications
);
//update rescue details
router.patch(
  "/:rescueId",
  isAdmin,
  rescuesController.uploadImages,
  rescuesController.updateRescue
);

router.delete("/rescue/:rescueId", isAdmin, rescuesController.deleteRescue);

module.exports = router;
