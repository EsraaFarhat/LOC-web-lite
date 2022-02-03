const express = require("express");

const {
  UserLoginHandler,
  UserLogoutHandler,
} = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/login", UserLoginHandler);

router.post("/logout", auth, UserLogoutHandler);

module.exports = router;
