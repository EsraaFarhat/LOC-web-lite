const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
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
    // console.log(isMatch);
    if (!isMatch) throw new Error("Invalid email or password!");

    return { user };
  } catch (e) {
    return { err: e.message };
  }
};

exports.findUserById = async (id) => {
  try {
    const user = await User.findOne({ where: { user_id: id } });
    return user;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createUser = async (request) => {
  try {
    const newUser = await User.create(request);

    return newUser;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateUser = async (id, request) => {
  try {
    const user = await User.update(request, {
      where: {
        user_id: id,
      },
      individualHooks: true,
      returning: true,
    });

    return user;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.deleteUser = async (id) => {
  try {
    await User.destroy({
      where: {
        user_id: id,
      },
    });
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
      body: JSON.stringify({ email, password }),
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

    return { message: "Logged in successfully..", user: response.user };
  } catch (e) {
    return { error: e.message };
  }
};

exports.updateUsersData = async (token) => {
  try {
    let response = await fetch(`${process.env.EC2_URL}/api/users/web-lite`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    response = await response.json();
    if (response.error) {
      return {
        error: `Couldn't update users' data!`,
        reason: response.error,
      };
    }
    let errors = [];
    response.users.forEach(async (user) => {
      // if (user.role === "super user") user.sup_id = null;
      let local_user = await this.findUserById(user.user_id);
      if (!local_user) {
        try {
          let user_with_email = await this.findUser(user.email);
          if (user_with_email) await this.deleteUser(user_with_email.user_id);
          try {
            await this.createUser(user);
            console.log("user created");
          } catch (e) {
            return { error: e.message };
          }
        } catch (e) {
          errors.push(`Couldn't create user ${user.user_id}: ${e.message}`);
        }
      } else {
        try {
          let user_with_email = await this.findUser(user.email);
          if (user_with_email && user_with_email.user_id !== local_user.user_id)
            await this.deleteUser(user_with_email.user_id);
          try {
            await this.updateUser(local_user.user_id, user);
            console.log("user updated");
          } catch (e) {
            return { error: e.message };
          }
        } catch (e) {
          errors.push(`Couldn't update user ${user.user_id}: ${e.message}`);
        }
      }
    });
    if (errors.length !== 0) return { errors };

    return { message: "Users updated successfully.." };
  } catch (e) {
    return { error: e.message };
  }
};

exports.validateLogin = (user) => {
  const schema = Joi.object({
    email: Joi.string().trim().max(255).required().email(),
    password: Joi.string().trim().min(5).max(255).required(),
  });
  return schema.validate(user, { abortEarly: false });
};
