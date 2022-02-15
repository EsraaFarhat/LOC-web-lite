const express = require("express");

const auth = require("../middleware/auth");
const {
  getLocationsForProjectHandler,
} = require("../controllers/project.controller");

const router = express.Router();

// Get all locations belong to a project
router.get("/:id/locations", auth, getLocationsForProjectHandler);

module.exports = router;
