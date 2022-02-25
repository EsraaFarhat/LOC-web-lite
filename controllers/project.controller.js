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
    const project_id = req.params.id;

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
      // let response = await UserLoginToMainServerHandler(
      //   req.user.email,
      //   req.user.password
      // );
      // if (response.error) {
      //   return res.status(400).json({
      //     error: "Cannot do this operation on the main server!",
      //     reason: response.error,
      //   });
      // }

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
        await log(
          req.user.user_id,
          req.user.fullName,
          null,
          `Failed to fetch all locations for project ${project_id} from main server`,
          "GET"
        );
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Fetch all locations for project ${project_id} from main server`,
        "GET"
      );
      return res.json({ locations: data.locations });
    }

    //            ****************Local server*****************
    const locations = await getLocationsForProject(filter);

    await log(
      req.user.user_id,
      req.user.fullName,
      project.gid,
      `Fetch All locations for project (${project_id}) on local server`,
      "GET",
    );

    res.json({ locations });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to get all locations for project with id (${req.body.id}) on local server`,
      "GET",
    );
    res.status(500).json({ error: e.message });
  }
};
