const GlobalIdentifier = require("../models/globalidentifier");
const Project = require("../models/project");
const User = require("../models/user");
const { findUserAssignedToGlobalIdentifier } = require("./globalIdentifier.service");

exports.findProjectById = async (id) => {
  try {
    const project = await Project.findOne({
      where: { id },
      include: [
        {
          model: GlobalIdentifier,
        },
      ],
    });
    return project;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.findProject = async (filter) => {
  try {
    const project = await Project.findOne({
      where: filter,
    });
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
        {
          model: GlobalIdentifier,
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

exports.deleteProject = async (id) => {
  try {
    await Project.destroy({ where: { id } });
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

exports.getProjectsForSuperAdmin = async (filter, loggedInUser) => {
  try {
    let projects = await Project.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: GlobalIdentifier,
          include: [
            {
              model: User,
              attributes: ["user_id"],
            },
          ],
        },
      ],
    });

    projects = projects.filter(
      async (project) => project.GlobalIdentifier.org_id === loggedInUser.org_id
    );

    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectsForSuperUser = async (filter, loggedInUser) => {
  try {
    let projects = await Project.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: GlobalIdentifier,
          include: [
            {
              model: User,
              attributes: ["user_id"],
            },
          ],
        },
      ],
    });

    projects = projects.filter(
      async (project) =>
        project.GlobalIdentifier.user_id === loggedInUser.user_id ||
        (project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getProjectsForUser = async (filter, loggedInUser) => {
  try {
    let projects = await Project.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: GlobalIdentifier,
          include: [
            {
              model: User,
              attributes: ["user_id"],
            },
          ],
        },
      ],
    });

    projects = projects.filter(
      async (project) =>
        (project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return projects;
  } catch (e) {
    throw new Error(e.message);
  }
};
