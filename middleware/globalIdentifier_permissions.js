const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const {
  getGlobalIdentifierWithUser,
} = require("../services/globalIdentifier.service");

exports.canGetProjects = async (req, res, next) => {
  try {
    if (!uuid.validate(req.params.gid)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to Fetch all projects for Global Identifier with id (${req.params.gid})`,
        "GET",
        "error",
        400
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const gid = req.params.gid;
    const globalIdentifier = await getGlobalIdentifierWithUser(gid);

    if (!globalIdentifier) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get all projects for Global Identifier with id (${gid}) (doesn't exist)`,
        "GET",
        "error",
        404
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

    if (
      req.user.role !== "admin" &&
      globalIdentifier.User.sup_id !== req.user.sup_id &&
      globalIdentifier.User.sup_id !== req.user.user_id &&
      globalIdentifier.User.user_id !== req.user.user_id
    ) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get projects for Global Identifier with id (${gid})`,
        "error",
        400
      );
      return res
        .status(400)
        .json({ error: "Cannot get projects for this global identifier!" });
    }

    next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
