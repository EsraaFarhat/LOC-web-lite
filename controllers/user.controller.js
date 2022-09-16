const {
  updateUsersData,
  UserLoginToMainServerHandler,
  updateUser,
} = require("../services/user.service");
const { log } = require("./log.controller");

exports.updateUserStatusHandler = async (req, res) => {
  try {
    const id = req.params.id;
    let user = req.userToSuspend;

    user = await updateUser(id, { suspend: !user.suspend });

    if (user[1][0].dataValues.suspend) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Suspend user (${id})`,
        "PATCH"
      );
      return res.json({
        message: "User suspended successfully..",
      });
    }

    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Unsuspend user (${id})`,
      "PATCH"
    );
    res.json({
      message: "User unsuspend successfully..",
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to suspend user`,
      "PATCH"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.UpdateUsersDataHandler = async (req, res) => {
  try {
    const result = await updateUsersData(req.user.token);
    if (result.errors) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to update all users for user ${req.user.user_id}`,
        "POST"
      );
      return res.status(400).json({
        message: "Users updated with errors",
        errors: result.errors,
      });
    }

    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Update all users for user ${req.user.user_id}`,
      "POST"
    );

    res.json({ message: "Users updated successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to update users for user with id (${req.user.user_id})`,
      "POST"
    );
    res.status(500).json({ error: e.message });
  }
};
