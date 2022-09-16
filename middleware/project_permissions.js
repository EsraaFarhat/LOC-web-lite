const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const {
  findUserAssignedToGlobalIdentifier,
} = require("../services/globalIdentifier.service");
const { getProjectWithUser } = require("../services/project.service");

exports.canGetLocations = async (req, res, next) => {
  try {
    if (req.query.mode === "main") {
      return next();
    }

    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get locations for project with id (${req.params.id})`,
        "GET"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const project_id = req.params.id;
    const project = await getProjectWithUser(project_id);
    if (!project) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get locations for project with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "Project doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR this project wasn't created by your super user or any user in your company
     ** OR you are not the user created this project
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = true;
    } else if (req.user.role === "super admin") {
      hasAccess = project.GlobalIdentifier.org_id === req.user.org_id;
    } else if (req.user.role === "super user") {
      hasAccess =
        project.GlobalIdentifier.user_id === req.user.user_id ||
        (project.GlobalIdentifier.org_id === req.user.org_id &&
          project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: project.gid,
          user_id: req.user.user_id,
        }));
    } else {
      hasAccess =
        (project.GlobalIdentifier.org_id === req.user.org_id &&
          project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: project.gid,
          user_id: req.user.user_id,
        }));
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        project.gid,
        `Failed to get locations for project with id (${req.params.id})`,
        "GET"
      );
      return res
        .status(400)
        .json({ error: "Cannot get locations for this Project!" });
    }

    req.projectToGet = project;
    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to get locations for project with id (${req.params.id})`,
      "GET"
    );
    return res.status(500).json({ error: e.message });
  }
};
