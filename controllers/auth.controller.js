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
  validateLogin,
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
          if (user.role === "admin") {
            return resolve({
              error: "Cannot login to the server!",
            });
          }
          console.log(user);
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
    // validate the request first
    const { error } = validateLogin(req.body);
    if (error) {
      await log(
        null,
        null,
        null,
        `Failed to login user ${req.body.email} (Validation error)`,
        "POST"
      );
      return res.status(400).json({
        error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      });
    }
    let { user, err } = await findUserByCredentials(
      req.body.email,
      req.body.password
    );
    let token;
    if (user) {
      if (user.role === "admin") {
        return res.status(400).json({ error: "Cannot login to the server!" });
      }
      token = await generateAuthToken(user);
    } else if (err) {
      const result = await this.LoginFromMain(req, err);
      if (result.error) {
        await log(
          null,
          null,
          null,
          `Failed to login user ${req.body.email}`,
          "POST"
        );
        return res
          .status(400)
          .json({ error: result.error, reason: result.reason });
      }
      user = result;
      token = result.token;
    }

    await log(
      user.user_id,
      user.fullName,
      null,
      `User ${user.email} logged in`,
      "POST"
    );

    if (user.role === "super user") {
      const response = await updateUsersData(token);
      if (response.errors) {
        await log(
          user.user_id,
          user.fullName,
          null,
          `Failed to update all users for user ${user.user_id}`,
          "POST"
        );

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
      await log(
        user.user_id,
        user.fullName,
        null,
        `Update all users for user ${user.user_id}`,
        "POST"
      );
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
    await log(
      null,
      null,
      null,
      `Failed to login user ${req.body.email}`,
      "POST"
    );
    res.status(400).json({ error: e.message });
  }
};
