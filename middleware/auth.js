const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const User = require("../models/user");
require("dotenv").config();

const auth = async (req, res, next) => {
  try {
    const authToken = req.header("Authorization").replace("Bearer ", "");
    // console.log(authToken);
    const loggedInUser = await User.findOne({ where: { token: authToken } });

    const message = process.env.MESSAGE,
      nonce = loggedInUser.email,
      path = process.env.PATH,
      privateKey = process.env.PRIVATE_KEY;

    let hashDigest = sha256(nonce + message);
    hashDigest = sha256(nonce + message);
    const token = Base64.stringify(hmacSHA512(path + hashDigest, privateKey));

    // console.log(token);
    // // const decoded = jwt.verify(authToken, process.env.PRIVATE_KEY);
    // const user = await User.findOne({ where: { email: req.user.email } });
    // console.log(user);
    // // If the user was deleted or his token was deleted from the database
    if (!loggedInUser || token !== authToken) {
      throw new Error("Unable to authenticate!");
    }

    // req.token = authToken;
    req.user = loggedInUser;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unable to authenticate!" });
  }
};

module.exports = auth;
