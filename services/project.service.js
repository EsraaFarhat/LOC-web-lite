const Project = require("../models/project");

exports.findProjectById = async (id) => {
  try {
    const project = await Project.findByPk(id);
    return project;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createProject = async (request) => {
  try {
    const newProject = await Project.create(request);
    return newProject;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateProject = async (id, request) => {
  try {
    const project = await Project.update(request, {
      where: { id },
      returning: true,
    });
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
