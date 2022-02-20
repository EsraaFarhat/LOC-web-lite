const uuid = require("uuid");

const {
  getAllGlobalIdentifiers,
  findGlobalIdentifierById,
} = require("../services/globalIdentifier.service");

const {
  getProjectsForGlobalIdentifier,
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

    const globalIdentifiers = await getAllGlobalIdentifiers(filter);

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
    if (!uuid.validate(req.params.gid)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to Fetch Global Identifier with id (${req.params.gid})`,
        "GET",
        "error",
        400
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const gid = req.params.gid;

    // check if the global identifier exists in database
    const globalIdentifier = await findGlobalIdentifierById(gid);

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

    let filter = {};
    filter.gid = gid;
    if (req.query.name) {
      filter.name = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),
        "LIKE",
        "%" + req.query.name.toLowerCase() + "%"
      );
    }

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
