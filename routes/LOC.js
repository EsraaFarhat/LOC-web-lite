const express = require("express");

const {
  createLOCHandler,
  updateLOCHandler,
} = require("../controllers/LOC.controller");
const auth = require("../middleware/auth");
const {
  canUpdate,
  canGetLocationForCreateLOC,
} = require("../middleware/LOC_permissions");

const router = express.Router();

// Create New LOC [single/dual]
router.post("/", [auth, canGetLocationForCreateLOC], createLOCHandler);

// Update LOC By Id
router.patch("/:id", [auth, canUpdate], updateLOCHandler);

module.exports = router;
