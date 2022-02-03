const express = require("express");

const auth = require("../middleware/auth");
const { createLOCHandler } = require("../controllers/LOC.controller");

const router = express.Router();

// Create New LOC [single/dual]
router.post("/", auth, createLOCHandler);

module.exports = router;
