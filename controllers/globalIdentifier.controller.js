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
    const globalIdentifiers = await getAllGlobalIdentifiers();
    res.json({ globalIdentifiers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getProjectsForGlobalIdentifierHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.gid))
      return res.status(400).json({ error: "Invalid Id!" });

    const gid = req.params.gid;

    // check if the global identifier exists in database
    const globalIdentifier = await findGlobalIdentifierById(gid);

    if (!globalIdentifier)
      return res
        .status(404)
        .json({ error: "Global Identifier doesn't exist!" });

    const projects = await getProjectsForGlobalIdentifier(gid);

    res.json({ projects });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
