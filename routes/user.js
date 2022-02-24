const express = require("express");

const auth = require("../middleware/auth");
const {
    UpdateUsersDataHandler,
} = require("../controllers/user.controller");
const { isSuperUser } = require("../middleware/users_permissions");

const router = express.Router();

// Update all users data for a super user
router.get("/updateUsers", [auth, isSuperUser], UpdateUsersDataHandler);

module.exports = router;
