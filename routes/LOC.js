const express = require("express");

const auth = require("../middleware/auth");
const {
  createLOCHandler,
  updateLOCHandler,
} = require("../controllers/LOC.controller");

const router = express.Router();

// Create New LOC [single/dual]
router.post("/", auth, createLOCHandler);

// Update LOC By Id
router.patch("/:id", auth, updateLOCHandler);

module.exports = router;
