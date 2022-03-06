const express = require("express");

const {
  getLOCHandler,
  createLOCHandler,
  updateLOCHandler,
} = require("../controllers/LOC.controller");
const auth = require("../middleware/auth");
const {
  canGetLOC,
  canUpdate,
  canGetLocationForCreateLOC,
} = require("../middleware/LOC_permissions");

const router = express.Router();

// Get LOC By Id
router.get("/:id", [auth, canGetLOC], getLOCHandler);

// Create New LOC [single/dual]
router.post("/", [auth, canGetLocationForCreateLOC], createLOCHandler);

// Update LOC By Id
router.patch("/:id", [auth, canUpdate], updateLOCHandler);

module.exports = router;
