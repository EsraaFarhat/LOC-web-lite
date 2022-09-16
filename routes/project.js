const express = require("express");

const auth = require("../middleware/auth");
const {
  getLocationsForProjectHandler,
} = require("../controllers/project.controller");
const { canGetLocations } = require("../middleware/project_permissions");

const router = express.Router();

// Get all locations belong to a project
router.get(
  "/:id/locations",
  [auth, canGetLocations],
  getLocationsForProjectHandler
);

module.exports = router;
