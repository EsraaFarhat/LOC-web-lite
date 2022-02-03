const uuid = require("uuid");

const { findProjectById } = require("../services/project.service");
const { getLocationsForProject } = require("../services/location.service");

exports.getLocationsForProjectHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id))
      return res.status(400).json({ error: "Invalid Id!" });

    const project_id = req.params.id;
    // check if the project exists in database
    const project = await findProjectById(project_id);
    if (!project)
      return res.status(404).json({ error: "Project doesn't exist!" });

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

    res.json({ locations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
