const express = require("express");

const auth = require("../middleware/auth");
const {
  UpdateUsersDataHandler,
  updateUserStatusHandler,
} = require("../controllers/user.controller");
const {
  isSuperUser,
  canSuspend,
  checkIfUserSuspended,
  isUser,
} = require("../middleware/users_permissions");

const router = express.Router();

// Update the suspend status of a user
router.patch(
  "/:id/suspend",
  [auth, isUser, checkIfUserSuspended, canSuspend],
  updateUserStatusHandler
);

// Update all users data for a super user
router.get("/updateUsers", [auth], UpdateUsersDataHandler);

module.exports = router;
