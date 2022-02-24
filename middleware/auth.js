const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const User = require("../models/user");
require("dotenv").config();

const auth = async (req, res, next) => {
  try {
    const authToken = req.header("Authorization").replace("Bearer ", "");
    const loggedInUser = await User.findOne({ where: { token: authToken } });

    const message = process.env.MESSAGE,
      nonce = loggedInUser.email,
      path = "PathTONoWhere",
      privateKey = process.env.PRIVATE_KEY;

    let hashDigest = sha256(nonce + message);
    hashDigest = sha256(hashDigest);
    const token = Base64.stringify(hmacSHA512(path + hashDigest, privateKey));

    if (!loggedInUser || token !== authToken) {
      throw new Error("Unable to authenticate!");
    }

    req.user = loggedInUser;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unable to authenticate!" });
  }
};

module.exports = auth;
