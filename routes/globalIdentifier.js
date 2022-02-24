const express = require("express");

const {
  getAllGlobalIdentifiersHandler,
  getProjectsForGlobalIdentifierHandler,
} = require("../controllers/globalIdentifier.controller");
const auth = require("../middleware/auth");
const {
  canGetProjects,
} = require("../middleware/globalIdentifier_permissions");

const router = express.Router();

// Get All Global Identifiers
router.get("/", auth, getAllGlobalIdentifiersHandler);

// Get all projects belong to a global identifier
router.get(
  "/:gid/projects",
  [auth, canGetProjects],
  getProjectsForGlobalIdentifierHandler
);

module.exports = router;
