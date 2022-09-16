const express = require("express");

const auth = require("../middleware/auth");
const {
  getLocationHandler,
  downloadLocationHandler,
  uploadLocationHandler,
} = require("../controllers/location.controller");
const { canGetLocation } = require("../middleware/location_permissions");

const router = express.Router();

// Get Location By ID
router.get("/:id", [auth, canGetLocation], getLocationHandler);

// Download Location for web lite
router.get("/:id/download", auth, downloadLocationHandler);

// Upload Location for web lite
router.get("/:id/upload", auth, uploadLocationHandler);

module.exports = router;
