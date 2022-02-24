const { updateUsersData, UserLoginToMainServerHandler } = require("../services/user.service");
const { log } = require("./log.controller");

exports.UpdateUsersDataHandler = async (req, res) => {
  try {
    let response = await UserLoginToMainServerHandler(
      req.user.email,
      req.user.password
    );
    if (response.error) {
      return res.status(400).json({
        error: "Cannot update users!",
        reason: response.error,
      });
    }

    const result = await updateUsersData(req.user.token);
    if (result.errors) {
      return res.json({
        message: "Users updated with errors",
        errors: result.errors,
      });
    }

    res.json({ message: "Users updated successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to update users for super user with id (${req.user.user_id})`,
      "GET",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
