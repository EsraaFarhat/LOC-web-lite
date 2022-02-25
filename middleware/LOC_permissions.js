const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const { getLOCWithUser } = require("../services/LOC.service");

exports.canUpdate = async (req, res, next) => {
  try {
    if (req.query.mode === "main") {
      return next();
    }

    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;
    let loc = await getLOCWithUser(id);

    if (!loc) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "LOC doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR you are not the super user to the user created this LOC
     ** OR you are not the user created this LOC
     */
    let hasAccess = false;
    if (req.user.role === "admin") {
      hasAccess = true;
    }
    if (req.user.role === "super user") {
      hasAccess =
        loc.User.user_id === req.user.user_id ||
        loc.User.sup_id === req.user.user_id;
    } else if (req.user.role === "user") {
      hasAccess = loc.User.user_id === req.user.user_id;
    }
    if (
      !hasAccess
      // req.user.role !== "admin" &&
      // loc.User.sup_id !== req.user.user_id &&
      // loc.User.user_id !== req.user.user_id
    ) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(400).json({ error: "Cannot update loc!" });
    }
    req.locToUpdate = loc;

    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to get LOC with id (${req.params.id})`,
      "GET"
    );
    return res.status(500).json({ error: e.message });
  }
};
