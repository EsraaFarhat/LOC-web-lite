const _ = require("lodash");
const uuid = require("uuid");
const sequelize = require("../db/postgres/db");
const { log } = require("./log.controller");

const {
  getAllGlobalIdentifiers,
  findGlobalIdentifierById,
  getGlobalIdentifiersForSuperUser,
  getGlobalIdentifiersForUser,
} = require("../services/globalIdentifier.service");

const {
  getProjectsForGlobalIdentifier,
} = require("../services/project.service");
const { UserLoginToMainServerHandler } = require("../services/user.service");

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
        `${process.env.EC2_URL}/api/globalIdentifiers?name=${req.query.name}`,
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
      return res.json({ globalIdentifiers: data.globalIdentifiers });
    }

    //            ****************Local server*****************
    // let globalIdentifiers;
    // if (req.user.role === "admin") {
    //   globalIdentifiers = await getAllGlobalIdentifiers(filter);
    // } else
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
      `Fetch All Global Identifiers`,
      "GET",
      "success",
      200
    );

    res.json({ globalIdentifiers });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to Fetch All Global Identifiers`,
      "GET",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};

exports.getProjectsForGlobalIdentifierHandler = async (req, res) => {
  try {
    // if (!uuid.validate(req.params.gid)) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to Fetch Global Identifier with id (${req.params.gid})`,
    //     "GET",
    //     "error",
    //     400
    //   );
    //   return res.status(400).json({ error: "Invalid Id!" });
    // }

    const gid = req.params.gid;

    // check if the global identifier exists in database
    // const globalIdentifier = await findGlobalIdentifierById(gid);

    // if (!globalIdentifier) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to get all projects for Global Identifier with id (${gid}) (doesn't exist)`,
    //     "GET",
    //     "error",
    //     404
    //   );
    //   return res
    //     .status(404)
    //     .json({ error: "Global Identifier doesn't exist!" });
    // }

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
        `${process.env.EC2_URL}/api/globalIdentifiers/${gid}/projects?name=${req.query.name}`,
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
      return res.json({ projects: data.projects });
    }

    //            ****************Local server*****************
    const projects = await getProjectsForGlobalIdentifier(filter);

    await log(
      req.user.user_id,
      req.user.fullName,
      gid,
      `Fetch all projects for Global Identifier (${gid})`,
      "GET",
      "success",
      200
    );

    res.json({ projects });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      req.params.gid,
      `Failed to Fetch all projects for Global Identifier (${req.params.gid})`,
      "GET",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
