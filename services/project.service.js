const Project = require("../models/project");
const User = require("../models/user");

exports.findProjectById = async (id) => {
  try {
    const project = await Project.findByPk(id);
    return project;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectWithUser = async (id) => {
  try {
    const project = await Project.findOne({
      where: { id },
      include: [
        {
          model: User,
        },
      ],
    });
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

exports.getProjectsForSuperUser = async (filter, loggedInUser) => {
  try {
    const projects = await Project.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });
    return projects.filter(
      (project) =>
        project.User.user_id === loggedInUser.user_id ||
        project.User.sup_id === loggedInUser.user_id
    );
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectsForUser = async (filter, loggedInUser) => {
  try {
    const projects = await Project.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });
    return projects.filter(
      (project) =>
        project.User.user_id === loggedInUser.user_id ||
        project.User.sup_id === loggedInUser.sup_id ||
        project.User.user_id === loggedInUser.sup_id
    );
  } catch (e) {
    throw new Error(e.message);
  }
};
