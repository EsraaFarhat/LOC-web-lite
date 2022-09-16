const express = require("express");

const {
  UserLoginHandler,
  // UserLogoutHandler,
  UserAppLoginHandler,
} = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/login", UserLoginHandler);

// router.post("/app/login", UserAppLoginHandler);

module.exports = router;
