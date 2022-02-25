const { updateUsersData, UserLoginToMainServerHandler } = require("../services/user.service");
const { log } = require("./log.controller");

exports.UpdateUsersDataHandler = async (req, res) => {
  try {
    // let response = await UserLoginToMainServerHandler(
    //   req.user.email,
    //   req.user.password
    // );
    // if (response.error) {
    //   return res.status(400).json({
    //     error: "Cannot update users!",
    //     reason: response.error,
    //   });
    // }

    const result = await updateUsersData(req.user.token);
    if (result.errors) {
      await log(
        req.user.user_id,
        req.user.fullName,
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
      req.user.fullName,
      null,
      `Update all users for user ${req.user.user_id}`,
      "POST"
    );

    res.json({ message: "Users updated successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to update users for user with id (${req.user.user_id})`,
      "POST",
    );
    res.status(500).json({ error: e.message });
  }
};
