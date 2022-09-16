const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const { findUserAssignedToGlobalIdentifier } = require("../services/globalIdentifier.service");
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
     if (req.user.role === "saas admin") {
       hasAccess = true;
     } else if (req.user.role === "super admin") {
       hasAccess = location.Project.GlobalIdentifier.org_id === req.user.org_id;
     } else if (req.user.role === "super user") {
       hasAccess =
         location.Project.GlobalIdentifier.user_id === req.user.user_id ||
         (location.Project.GlobalIdentifier.org_id === req.user.org_id &&
           location.Project.GlobalIdentifier.privacy === "public") ||
         (await findUserAssignedToGlobalIdentifier({
           gid: location.Project.gid,
           user_id: req.user.user_id,
         }));
     } else {
       hasAccess =
         (location.Project.GlobalIdentifier.org_id === req.user.org_id &&
           location.Project.GlobalIdentifier.privacy === "public") ||
         (await findUserAssignedToGlobalIdentifier({
           gid: location.Project.gid,
           user_id: req.user.user_id,
         }));
     } 

    if (!hasAccess) {
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
