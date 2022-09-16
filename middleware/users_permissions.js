const { log } = require("../controllers/log.controller");
const { findUser } = require("../services/user.service");

exports.isSaasAdminOrSuperAdminSuperUser = async (req, res, next) => {
  if (
    req.user.role !== "saas admin" &&
    req.user.role !== "super admin" &&
    req.user.role !== "super user"
  ) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Permission denied`,
      "POST"
    );
    return res.status(403).json({ error: "Permission denied!" });
  }

  next();
};

exports.isSuperUser = async (req, res, next) => {
  if (req.user.role !== "super user") {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Permission denied`,
      "POST"
    );
    return res.status(403).json({ error: "Permission denied!" });
  }

  next();
};

exports.isUser = async (req, res, next) => {
  if (req.user.role === "user") {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Permission denied`,
      "POST"
    );
    return res.status(403).json({ error: "Permission denied!" });
  }

  next();
};

exports.canSuspend = async (req, res, next) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to suspend user with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }
    let user = await findUserById(req.params.id);
    if (!user) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to suspend user with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(404).json({ error: "User doesn't exist!" });
    }
    /*
     ** Admin Can suspend any user or superuser But can't suspend himself or any other admin
     ** Superuser Can suspend any user belongs to him
     ** User can't suspend anyone
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = user.role !== "saas admin";
    } else if (req.user.role === "super admin") {
      hasAccess =
        user.org_id === req.user.org_id && user.user_id !== req.user.user_id;
    } else if (req.user.role === "admin") {
      hasAccess =
        user.org_id === req.user.org_id &&
        (user.role !== "super admin" || user.role !== " admin");
    } else if (req.user.role === "super user") {
      hasAccess = user.org_id === req.user.org_id && user.role === "user";
    } else {
      hasAccess = false;
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to suspend user with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(403).json({ error: "Permission denied!" });
    }
    req.userToSuspend = user;

    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to suspend user with id (${req.params.id})`,
      "PATCH"
    );
    return res.status(500).json({ error: e.message });
  }
};

exports.checkIfUserSuspended = async (req, res, next) => {
  try {
    if (req.user.role === "super admin" && req.user.suspend) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Couldn't complete the ${req.method} operation because user ${req.user.email} has been suspended!`,
        "POST"
      );
      return res.status(403).json({
        error:
          "Couldn't complete this operation because you have been suspended!",
      });
    } else if (
      req.user.role === "admin" ||
      req.user.role === "super user" ||
      req.user.role === "user"
    ) {
      if (req.user.suspend) {
        await log(
          req.user.user_id,
          req.user.email,
          null,
          `Couldn't complete the ${req.method} operation because user ${req.user.email} has been suspended!`,
          "POST"
        );
        return res.status(403).json({
          error:
            "Couldn't complete this operation because you have been suspended!",
        });
      } else {
        const admin = await findUser({
          org_id: req.user.org_id,
          role: "super admin",
        });
        if (admin && admin.suspend) {
          await log(
            req.user.user_id,
            req.user.email,
            null,
            `Couldn't complete the ${req.method} operation because user ${req.user.email} has been suspended!`,
            "POST"
          );
          return res.status(403).json({
            error:
              "Couldn't complete this operation because you have been suspended!",
          });
        }
      }
    }

    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Couldn't complete the ${req.method} operation`,
      "POST"
    );
    return res.status(500).json({ error: e.message });
  }
};
