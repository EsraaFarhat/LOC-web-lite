const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sequelize = require("../db/postgres/db");
const _ = require("lodash");
const { log } = require("./log.controller");
const {
  getLocationsForSuperUser,
  getLocationsForUser,
} = require("../services/location.service");

exports.getLocationsForProjectHandler = async (req, res) => {
  const project_id = req.params.id;
  let project = req.projectToGet;
  try {
    // let filter = {};
    // filter.project_id = project_id;
    // if (req.query.name) {
    //   filter.name = sequelize.where(
    //     sequelize.fn("LOWER", sequelize.col("name")),
    //     "LIKE",
    //     "%" + req.query.name.toLowerCase() + "%"
    //   );
    // } else { filter.name = "" ;}

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(
        `${process.env.EC2_URL}/api/projects/${project_id}/locations`,
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
          req.user.email,
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
        req.user.email,
        null,
        `Fetch all locations for project ${project_id} from main server`,
        "GET"
      );
      return res.json({
        locations: data.locations,
        project: data.project,
        globalIdentifier: data.globalIdentifier,
      });
    }

    //            ****************Local server*****************
    // const locations = await getLocationsForProject(filter);
    let locations = [];
    // if (req.user.role === "admin") {
    //   locations = await getLocationsForAdmin(filter);
    // } else
    if (req.user.role === "super user") {
      locations = await getLocationsForSuperUser({project_id: project.id}, req.user);
    } else if (req.user.role === "user") {
      locations = await getLocationsForUser({project_id: project.id}, req.user);
    }

    await log(
      req.user.user_id,
      req.user.email,
      project.gid,
      `Fetch All locations for project (${project_id}) on local server`,
      "GET"
    );

    // console.log(project);
    globalIdentifier = _.pick(project, [
      "GlobalIdentifier.gid",
      "GlobalIdentifier.name",
    ]).GlobalIdentifier;
    project = _.pick(project, ["id", "name"]);

    // console.log(locations, project, globalIdentifier);
    res.json({ locations, project, globalIdentifier });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      project.gid,
      `Failed to get all locations for project with id (${req.body.id}) on local server`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};
