const _ = require("lodash");

const {
  findUserByCredentials,
  generateAuthToken,
} = require("../services/user.service");

exports.UserLoginHandler = async (req, res) => {
  try {
    const user = await findUserByCredentials(req.body.email, req.body.password);

    const token = await generateAuthToken(user);

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

    res.json({ message: "Logged out successfully.." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
