const express = require("express");
const multer = require("multer");

const {
  getLOCsHandler,
  getLOCHandler,
  createLOCHandler,
  updateLOCHandler,
  uploadFileHandler,
} = require("../controllers/LOC.controller");
const auth = require("../middleware/auth");
const {
  canGetLOC,
  canUpdate,
  canGetLocationForCreateLOC,
} = require("../middleware/LOC_permissions");
const { canGetLocation } = require("../middleware/location_permissions");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx)$/)) {
      return cb(new Error("Please upload a .xlsx file!"));
    }
    cb(undefined, true);
  },
});

// Get all [assigned/unassigned] [single/dual] LOCs for a location
router.get("/:id/:cable_status", [auth, canGetLocation], getLOCsHandler);

// Get LOC By Id
router.get("/:id", [auth, canGetLOC], getLOCHandler);

// Create New LOC [single/dual]
router.post("/", [auth, canGetLocationForCreateLOC], createLOCHandler);

// Update LOC By Id
router.patch("/:id", [auth, canUpdate], updateLOCHandler);

// Upload .xlsx file
router.post("/upload/:id", [auth, upload.single("LocFile")], uploadFileHandler);

module.exports = router;
