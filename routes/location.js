const express = require("express");

const auth = require("../middleware/auth");
const {
  downloadLocationHandler,
  uploadLocationHandler,
} = require("../controllers/location.controller");

const router = express.Router();

// Download Location for web lite
router.get("/:id/download", auth, downloadLocationHandler);

// Upload Location for web lite
router.get("/:id/upload", auth, uploadLocationHandler);

module.exports = router;
