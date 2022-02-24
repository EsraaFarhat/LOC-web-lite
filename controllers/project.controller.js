const _ = require("lodash");
const uuid = require("uuid");
const { log } = require("./log.controller");

const { findProjectById } = require("../services/project.service");
const { getLocationsForProject } = require("../services/location.service");

exports.getLocationsForProjectHandler = async (req, res) => {
  try {
    // if (!uuid.validate(req.params.id)) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to get project with id (${req.params.id})`,
    //     "GET",
    //     "error",
    //     400
    //   );
    //   return res.status(400).json({ error: "Invalid Id!" });
    // }

    const project_id = req.params.id;
    // check if the project exists in database
    // const project = await findProjectById(project_id);
    // if (!project) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to get project with id (${project_id}) (doesn't exist)`,
    //     "GET",
    //     "error",
    //     404
    //   );
    //   return res.status(404).json({ error: "Project doesn't exist!" });
    // }

    let filter = {};
    filter.project_id = project_id;
    if (req.query.name) {
      filter.name = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        "LIKE",
        "%" + req.query.name.toLowerCase() + "%"
      );
    }

    const locations = await getLocationsForProject(filter);

    await log(
      req.user.user_id,
      req.user.fullName,
      project.gid,
      `Fetch All locations for project (${project_id})`,
      "GET",
      "success",
      200
    );

    res.json({ locations });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to get all locations for project with id (${req.body.id})`,
      "GET",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
