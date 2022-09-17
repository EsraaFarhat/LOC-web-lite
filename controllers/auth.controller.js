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
  findUser,
  deleteUser,
  updateUser,
} = require("../services/user.service");
const {
  findOrganizationById,
  createOrganization,
} = require("../services/organization.service");
const { EC2_URL } = require("../EC2_url");

exports.LoginFromMain = async (req, error) => {
  return new Promise((resolve, reject) => {
    require("dns").resolve("www.google.com", async function (err) {
      if (err) {
        return resolve({ error });
      } else {
        let user;
        try {
          let response = await UserLoginToMainServerHandler(
            req.body.email,
            req.body.password
          );
          if (response.error) {
            return resolve({
              error: response.error,
              reason: response.reason,
            });
          } else {
            user = response.user;
            if (user.role === "saas admin" || user.role === "admin") {
              return resolve({
                error: "You have no access to the web lite!",
              });
            }
            // console.log(user);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            user.password = hashedPassword;

            const message = "TryingToGenerateToken",
              nonce = user.email,
              path = "PathTONoWhere",
              privateKey = process.env.PRIVATE_KEY;

            let hashDigest = sha256(nonce + message);
            hashDigest = sha256(hashDigest);
            const token = Base64.stringify(
              hmacSHA512(path + hashDigest, privateKey)
            );

            user.token = token;
            // if (user.role === "super user") user.sup_id = null;
            // console.log(user);
            // if (user.role === "super user" || user.role === "user") {
            let organization = await findOrganizationById(user.org_id);
            if (!organization) {
              let response = await fetch(
                `${EC2_URL}/api/organizations/${user.org_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              response = await response.json();
              console.log(response);
              if (response.error) {
                return resolve({
                  error: `Cannot create this user in database: ${response.error}`,
                });
              }
              await createOrganization(response.organization);
              // response.user.sup_id = null;
              // await createUser(user);
            }
            // }
            // If the password change
            let oldUser = await findUser(user.email);
            if (oldUser) await updateUser(oldUser.user_id, user);
            else await createUser(user);
            resolve(user);
          }
        } catch (e) {
          await log(
            null,
            null,
            null,
            `Failed to login user ${user.email}`,
            "POST"
          );
          return resolve({
            error: `Cannot create this user in database: ${e.message}`,
          });
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
      if (user.role === "saas admin" || user.role === "admin") {
        return res
          .status(400)
          .json({ error: "You have no access to the web lite!" });
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
      user.email,
      null,
      `User ${user.email} logged in`,
      "POST"
    );

    // if (user.role === "super user") {
    //   const response = await updateUsersData(token);
    //   if (response.errors) {
    //     await log(
    //       user.user_id,
    //       user.email,
    //       null,
    //       `Failed to update all users for user ${user.user_id}`,
    //       "POST"
    //     );

    //     return res.json({
    //       user: _.pick(user, [
    //         "user_id",
    //         "fullName",
    //         "email",
    //         "role",
    //         "sup_id",
    //       ]),
    //       token,
    //       message: "Users updated with errors",
    //       errors: response.errors,
    //     });
    //   }
    //   await log(
    //     user.user_id,
    //     user.email,
    //     null,
    //     `Update all users for user ${user.user_id}`,
    //     "POST"
    //   );
    //   return res.json({
    //     user: _.pick(user, ["user_id", "fullName", "email", "role", "sup_id"]),
    //     token,
    //     message: "Users updated successfully..",
    //   });
    // }

    // !!!!!!!!!
    // if (user.role === "super user" && user.suspend) {
    //   await log(
    //     user.user_id,
    //     user.email,
    //     null,
    //     `User ${user.email} failed to logged in (suspended)`,
    //     "POST"
    //   );
    //   return res.status(403).json({
    //     error: "You have been suspended, return to admin for more details...",
    //   });
    // }
    // if (user.role === "user") {
    //   if (user.suspend) {
    //     await log(
    //       user.user_id,
    //       user.email,
    //       null,
    //       `User ${user.email} failed to logged in (suspended)`,
    //       "POST"
    //     );
    //     return res.status(403).json({
    //       error: "You have been suspended, return to admin for more details...",
    //     });
    //   } else {
    //     const superuser = await findUserById(user.sup_id);
    //     if (superuser.suspend) {
    //       await log(
    //         user.user_id,
    //         user.email,
    //         null,
    //         `User ${user.email} failed to logged in (suspended)`,
    //         "POST"
    //       );
    //       return res.status(403).json({
    //         error:
    //           "You have been suspended, return to admin for more details...",
    //       });
    //     }
    //   }
    // }

    res.json({
      user: _.pick(user, ["user_id", "fullName", "email", "role"]),
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

// exports.UserAppLoginHandler = async (req, res) => {
//   try {
//     // validate the request first
//     const { error } = validateLogin(req.body);
//     if (error) {
//       await log(
//         null,
//         null,
//         null,
//         `Failed to login user ${req.body.email} (Validation error)`,
//         "POST"
//       );
//       return res.status(400).json({
//         error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
//       });
//     }

//     const user = await findUserByCredentials(req.body.email, req.body.password);
//     if (user.role === "admin") {
//       await log(
//         user.user_id,
//         user.email,
//         null,
//         `User ${user.email} failed to logged in (Has no access to the app)`,
//         "POST"
//       );
//       return res.status(403).json({
//         error: "You have no access to the app!",
//       });
//     }

//     const token = await generateAuthToken(user);
//     await log(
//       user.user_id,
//       user.email,
//       null,
//       `User ${user.email} logged in`,
//       "POST"
//     );

//     res.json({
//       user: _.pick(user, [
//         "user_id",
//         "fullName",
//         "email",
//         "role",
//         "sup_id",
//         "createdAt",
//         "updatedAt",
//       ]),
//       token,
//     });
//   } catch (e) {
//     await log(
//       null,
//       null,
//       null,
//       `Failed to login user ${req.body.email}`,
//       "POST"
//     );
//     res.status(400).json({ error: e.message });
//   }
// };
