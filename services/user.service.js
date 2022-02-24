const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
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
      path = "PathTONoWhere",
      privateKey = process.env.PRIVATE_KEY;

    let hashDigest = sha256(nonce + message);
    hashDigest = sha256(hashDigest);
    const token = Base64.stringify(hmacSHA512(path + hashDigest, privateKey));

    user.token = token;
    await user.save();

    return token;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.UserLoginToMainServerHandler = async (email, password) => {
  try {
    let response = await fetch(`${process.env.EC2_URL}/api/auth/login`, {
      method: "post",
      body: JSON.stringify(email, password),
      headers: {
        "Content-Type": "application/json",
      },
    });

    response = await response.json();
    if (response.error) {
      return {
        error: `Couldn't login to the main server!`,
        reason: response.error,
      };
    }

    return { message: "Logged in successfully.." };
  } catch (e) {
    return { error: e.message };
  }
};
