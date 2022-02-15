const express = require("express");

const {
  getAllGlobalIdentifiersHandler,
  getProjectsForGlobalIdentifierHandler,
} = require("../controllers/globalIdentifier.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Get All Global Identifiers
router.get("/", auth, getAllGlobalIdentifiersHandler);

// Get all projects belong to a global identifier
router.get("/:gid/projects", auth, getProjectsForGlobalIdentifierHandler);

module.exports = router;
