const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const _ = require("lodash");
const sequelize = require("../db/postgres/db");
const { log } = require("./log.controller");

const {
  getGlobalIdentifiersForSuperUser,
  getGlobalIdentifiersForUser,
} = require("../services/globalIdentifier.service");

const {
  getProjectsForSuperUser,
  getProjectsForUser,
} = require("../services/project.service");

exports.getAllGlobalIdentifiersHandler = async (req, res) => {
  try {
    let filter = {};
    if (req.query.name) {
      filter.name = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        "LIKE",
        "%" + req.query.name.toLowerCase() + "%"
      );
    }

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(
        `${process.env.EC2_URL}/api/globalIdentifiers?name=${req.query.name}`,
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
          `Failed to fetch all global identifiers from main server`,
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
        `Get all global identifiers from main server`,
        "GET"
      );
      return res.json({ globalIdentifiers: data.globalIdentifiers });
    }

    //            ****************Local server*****************
    let globalIdentifiers;
    if (req.user.role === "super user") {
      globalIdentifiers = await getGlobalIdentifiersForSuperUser(
        filter,
        req.user
      );
    } else {
      globalIdentifiers = await getGlobalIdentifiersForUser(filter, req.user);
    }
    globalIdentifiers = _.map(globalIdentifiers, (globalIdentifier) =>
      _.pick(globalIdentifier.dataValues, [
        "gid",
        "name",
        "createdAt",
        "updatedAt",
        "user_id",
      ])
    );
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Fetch All Global Identifiers From local server`,
      "GET"
    );

    res.json({ globalIdentifiers });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to Fetch All Global Identifiers`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.getProjectsForGlobalIdentifierHandler = async (req, res) => {
  try {
    const gid = req.params.gid;

    let filter = {};
    filter.gid = gid;
    if (req.query.name) {
      filter.name = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        "LIKE",
        "%" + req.query.name.toLowerCase() + "%"
      );
    }

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(
        `${process.env.EC2_URL}/api/globalIdentifiers/${gid}/projects?name=${req.query.name}`,
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
          `Failed to fetch all projects for global identifier ${gid} from main server`,
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
        `Fetch all projects for global identifier ${gid} from main server`,
        "GET"
      );
      return res.json({ projects: data.projects });
    }

    //            ****************Local server*****************
    const globalIdentifier = _.pick(req.GlobalIdentifierToGet, ["gid", "name"]);

    // const projects = await getProjectsForGlobalIdentifier(filter);
    let projects = [];
    // if (req.user.role === "admin") {
    //   projects = await getProjectsForAdmin(filter);
    // } else
    if (req.user.role === "super user") {
      projects = await getProjectsForSuperUser(filter, req.user);
    } else if (req.user.role === "user") {
      projects = await getProjectsForUser(filter, req.user);
    }

    await log(
      req.user.user_id,
      req.user.fullName,
      gid,
      `Fetch all projects for Global Identifier (${gid}) from local server`,
      "GET"
    );

    res.json({ projects, globalIdentifier });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      req.params.gid,
      `Failed to Fetch all projects for Global Identifier (${req.params.gid})`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};
