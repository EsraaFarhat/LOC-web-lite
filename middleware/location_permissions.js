const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const { getLocationWithUser } = require("../services/location.service");

exports.canGetLocation = async (req, res, next) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get location with id (${req.params.id})`,
        "GET"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }
    const id = req.params.id;

    const location = await getLocationWithUser(id);
    if (!location) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get location with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "Location doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR you are not the user created this location
     ** OR this location wasn't created by your super user or any user in your company
     */
    let hasAccess = false;
    if (req.user.role === "admin") {
      hasAccess = true;
    }
    if (req.user.role === "super user") {
      hasAccess =
        location.User.user_id === req.user.user_id ||
        location.User.sup_id === req.user.user_id;
    } else if (req.user.role === "user") {
      hasAccess =
        location.User.user_id === req.user.user_id ||
        location.User.sup_id === req.user.sup_id ||
        location.User.user_id === req.user.sup_id;
    }
    if (
      !hasAccess
      // req.user.role !== "admin" &&
      // location.User.user_id !== req.user.user_id &&
      // location.User.sup_id !== req.user.sup_id &&
      // location.User.sup_id !== req.user.user_id
    ) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get location with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "Location doesn't exist!" });
    }
    req.locationToGet = location;
    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to get location with id (${req.params.id})`,
      "GET"
    );
    return res.status(500).json({ error: e.message });
  }
};
