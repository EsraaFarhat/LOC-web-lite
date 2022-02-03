const Project = require("../models/project");

exports.getProjectsForGlobalIdentifier = async (gid) => {
  try {
    const projects = await Project.findAll({ where: { gid } });
    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};