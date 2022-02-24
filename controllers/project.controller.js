const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const _ = require("lodash");
const uuid = require("uuid");
const { log } = require("./log.controller");

const { findProjectById } = require("../services/project.service");
const { getLocationsForProject } = require("../services/location.service");
const { UserLoginToMainServerHandler } = require("../services/user.service");

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

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      let response = await UserLoginToMainServerHandler(
        req.user.email,
        req.user.password
      );
      if (response.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: response.error,
        });
      }

      response = await fetch(
        `${process.env.EC2_URL}/api/projects/${project_id}/locations?name=${req.query.name}`,
        {
          headers: {
            Authorization: `Bearer ${req.user.token}`,
          },
        }
      );
      const data = await response.json();
      if (data.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }
      return res.json({ locations: data.locations });
    }

    //            ****************Local server*****************
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
