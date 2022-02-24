const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const { getProjectWithUser } = require("../services/project.service");

exports.canGetLocations = async (req, res, next) => {
  try {
    if(req.query.mode === "main"){
      return next();
    }
    
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get locations for project with id (${req.params.id})`,
        "GET",
        "error",
        400
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const project_id = req.params.id;
    const project = await getProjectWithUser(project_id);
    if (!project) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get locations for project with id (${project_id}) (doesn't exist)`,
        "GET",
        "error",
        404
      );
      return res.status(404).json({ error: "Project doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR this project wasn't created by your super user or any user in your company
     ** OR you are not the user created this project
     */

    if (
      req.user.role !== "admin" &&
      project.User.sup_id !== req.user.sup_id &&
      project.User.sup_id !== req.user.user_id &&
      project.User.user_id !== req.user.user_id
    ) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to get locations for Project with id (${project_id})`,
        "error",
        400
      );
      return res
        .status(400)
        .json({ error: "Cannot get locations for this Project!" });
    }

    next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
