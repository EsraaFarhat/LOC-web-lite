const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sha256 = require("crypto-js/sha256");
const hmacSHA512 = require("crypto-js/hmac-sha512");
const Base64 = require("crypto-js/enc-base64");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { log } = require("./log.controller");
const {
  findUserByCredentials,
  generateAuthToken,
  updateUsersData,
  UserLoginToMainServerHandler,
  createUser,
  findUserById,
} = require("../services/user.service");

exports.LoginFromMain = async (req, error) => {
  return new Promise((resolve, reject) => {
    require("dns").resolve("www.google.com", async function (err) {
      if (err) {
        resolve({ error });
      } else {
        let response = await UserLoginToMainServerHandler(
          req.body.email,
          req.body.password
        );
        if (response.error) {
          resolve({
            error: response.error,
            reason: response.reason,
          });
        } else {
          user = response.user;
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(req.body.password, salt);
          user.password = hashedPassword;
          const message = process.env.MESSAGE,
            nonce = user.email,
            path = "PathTONoWhere",
            privateKey = process.env.PRIVATE_KEY;

          let hashDigest = sha256(nonce + message);
          hashDigest = sha256(hashDigest);
          const token = Base64.stringify(
            hmacSHA512(path + hashDigest, privateKey)
          );

          user.token = token;
          if (user.role === "super user") user.sup_id = null;
          if (user.role === "user") {
            let superUser = await findUserById(user.sup_id);
            if (!superUser) {
              let response = await fetch(
                `${process.env.EC2_URL}/api/users/${user.sup_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              response = await response.json();
              if (response.error) {
                resolve({
                  error: "Cannot create this user in database!",
                });
              }
              response.user.sup_id = null;
              await createUser(response.user);
            }
          }
          await createUser(user);
          resolve(user);
        }
      }
    });
  });
};

exports.UserLoginHandler = async (req, res) => {
  try {
    let { user, error } = await findUserByCredentials(
      req.body.email,
      req.body.password
    );
    let token;
    if (user) {
      if (user.role === "admin") {
        return res.status(400).json({ error: "Cannot login to the server!" });
      }
      token = await generateAuthToken(user);
    } else if (error) {
      const result = await this.LoginFromMain(req, error);
      if (result.error) return res.status(400).json({ error: result.error, reason: result.reason });
      user = result;
      token = result.token;
    }

    await log(
      user.user_id,
      user.fullName,
      null,
      `User ${user.email} logged in`,
      "POST",
      "success",
      200
    );

    if (user.role === "super user") {
      const response = await updateUsersData(token);
      if (response.errors) {
        return res.json({
          user: _.pick(user, [
            "user_id",
            "fullName",
            "email",
            "role",
            "sup_id",
          ]),
          token,
          message: "Users updated with errors",
          errors: response.errors,
        });
      }
      return res.json({
        user: _.pick(user, ["user_id", "fullName", "email", "role", "sup_id"]),
        token,
        message: "Users updated successfully..",
      });
    }

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
    req.user.token = "";
    // req.user.tokens = req.user.tokens.filter(
    //   (token) => token.token !== req.token
    // );
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
