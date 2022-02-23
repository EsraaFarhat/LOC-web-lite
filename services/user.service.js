const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");

exports.findUser = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });

    return user;
  } catch (e) {
    throw new Error(e.message);
  }
};

// For Login
exports.findUserByCredentials = async (email, password) => {
  try {
    const user = await this.findUser(email);
    if (!user) throw new Error("Invalid email or password!");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password!");

    return user;
  } catch (e) {
    throw new Error(e.message);
  }
};

// Generate token for login
exports.generateAuthToken = async (user) => {
  try {
    const message = process.env.MESSAGE,
      nonce = user.email,
      path = process.env.PATH,
      privateKey = process.env.PRIVATE_KEY;

    let hashDigest = sha256(nonce + message);
    hashDigest = sha256(nonce + message);
    const token = Base64.stringify(hmacSHA512(path + hashDigest, privateKey));

    console.log(token);
    // const token = jwt.sign({ user_id: user.user_id }, process.env.PRIVATE_KEY);
    // user.tokens = user.tokens.concat({ token });

    user.token = token;
    await user.save();

    return token;
  } catch (e) {
    throw new Error(e.message);
  }
};
