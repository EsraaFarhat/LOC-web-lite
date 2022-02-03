const Project = require("../models/project");

exports.findProjectById = async (id) => {
  try {
    const project = await Project.findByPk(id);
    return project;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectsForGlobalIdentifier = async (gid) => {
  try {
    const projects = await Project.findAll({ where: { gid } });
    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};