const { log } = require("../controllers/log.controller");

exports.isSuperUser = async (req, res, next) => {
  if (req.user.role !== "super user") {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Permission denied`,
      "POST",
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
    if (req.user.role === "admin") {
      hasAccess = user.role !== "admin";
    } else if (req.user.role === "super user") {
      hasAccess = user.sup_id === req.user.user_id;
    } else if (req.user.role === "user") {
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
