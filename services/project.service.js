const Project = require("../models/project");

exports.findProjectById = async (id) => {
  try {
    const project = await Project.findByPk(id);
    return project;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectsForGlobalIdentifier = async (filter) => {
  try {
    const projects = await Project.findAll({ where: filter });
    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};