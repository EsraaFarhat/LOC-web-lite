const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const {
  getGlobalIdentifierWithUser,
  findUserAssignedToGlobalIdentifier,
} = require("../services/globalIdentifier.service");

exports.canGetProjects = async (req, res, next) => {
  try {
    if (req.query.mode === "main") {
      return next();
    }

    if (!uuid.validate(req.params.gid)) {
      await log(
        req.user.user_id,
        req.user.email,
        req.params.gid,
        `Failed to get projects for Global Identifier with id (${req.params.gid})`,
        "GET"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const gid = req.params.gid;
    const globalIdentifier = await getGlobalIdentifierWithUser(gid);

    if (!globalIdentifier) {
      await log(
        req.user.user_id,
        req.user.email,
        req.params.gid,
        `Failed to get projects for Global Identifier with id (${req.params.gid})`,
        "GET"
      );
      return res
        .status(404)
        .json({ error: "Global Identifier doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR this global identifier wasn't created by your super user or any user in your company
     ** OR you are not the user created this global identifier
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = true;
    } else if (req.user.role === "super admin") {
      hasAccess = globalIdentifier.org_id === req.user.org_id;
    } else if (req.user.role === "super user") {
      hasAccess =
        globalIdentifier.User.user_id === req.user.user_id ||
        (globalIdentifier.org_id === req.user.org_id &&
          globalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid,
          user_id: req.user.user_id,
        }));
    } else {
      hasAccess =
        (globalIdentifier.org_id === req.user.org_id &&
          globalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid,
          user_id: req.user.user_id,
        }));
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to get projects for Global Identifier with id (${req.params.gid})`,
        "GET"
      );
      return res
        .status(400)
        .json({ error: "Cannot get projects for this global identifier!" });
    }

    req.GlobalIdentifierToGet = globalIdentifier;

    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      req.params.gid,
      `Failed to get projects for Global Identifier with id (${req.params.gid})`,
      "GET"
    );
    return res.status(500).json({ error: e.message });
  }
};
