const _ = require("lodash");
const { log } = require("./log.controller");

const {
  findUserByCredentials,
  generateAuthToken,
} = require("../services/user.service");

exports.UserLoginHandler = async (req, res) => {
  try {
    const user = await findUserByCredentials(req.body.email, req.body.password);

    const token = await generateAuthToken(user);

    await log(
      user.user_id,
      user.fullName,
      null,
      `User ${user.email} logged in`,
      "POST",
      "success",
      200
    );

    res.json({
      user: _.pick(user, ["user_id", "fullName", "email", "role", "sup_id"]),
      token,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.UserLogoutHandler = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();

    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `User ${req.user.email} logged out`,
      "POST",
      "success",
      200
    );

    res.json({ message: "Logged out successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to logout user: ${req.user.email}`,
      "POST",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
