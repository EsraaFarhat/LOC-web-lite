const express = require("express");

const auth = require("../middleware/auth");
const {
    downloadLocationHandler,
} = require("../controllers/location.controller");

const router = express.Router();

// Download Location for web lite
router.get("/:id/download", auth, downloadLocationHandler);

module.exports = router;
