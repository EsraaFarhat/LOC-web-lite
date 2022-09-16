// const uuid = require("uuid");

const GlobalIdentifier = require("../models/globalidentifier");
const Location = require("../models/location");
const Project = require("../models/project");
const User = require("../models/user");
const {
  findUserAssignedToGlobalIdentifier,
} = require("./globalIdentifier.service");
// const User = require("../models/user");

// const { findProjectById } = require("../services/project.service");
// const {
//   findGlobalIdentifierById,
// } = require("../services/globalIdentifier.service");
// const { getLOCsByLocationId } = require("../services/LOC.service");

exports.findLocationById = async (id) => {
  try {
    const location = await Location.findByPk(id);
    return location;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.findLocation = async (filter) => {
  try {
    const location = await Location.findOne({
      where: filter,
    });
    return location;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationWithUser = async (id) => {
  try {
    const location = await Location.findOne({
      where: { id },
      include: [
        {
          model: User,
        },
        {
          model: Project,
          attributes: ["gid"],
          include: [
            {
              model: GlobalIdentifier,
              attributes: ["user_id", "privacy", "org_id"],
              include: [
                {
                  model: User,
                  attributes: ["user_id"],
                },
              ],
            },
          ],
        },
      ],
    });
    return location;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createLocation = async (request) => {
  try {
    const newLocation = await Location.create(request);
    return newLocation;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateLocation = async (id, request) => {
  try {
    const location = await Location.update(request, {
      where: { id },
      returning: true,
    });
    return location;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationsForProject = async (filter) => {
  try {
    const locations = await Location.findAll({ where: filter });
    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationsForSuperAdmin = async (filter, loggedInUser) => {
  try {

    let locations = await Location.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: Project,
          attributes: ["gid"],
          include: [
            {
              model: GlobalIdentifier,
              attributes: ["user_id", "privacy", "org_id"],
              include: [
                {
                  model: User,
                  attributes: ["user_id"],
                },
              ],
            },
          ],
        },
      ],
    });

    locations = locations.filter(
      async (location) =>
        location.Project.GlobalIdentifier.org_id === loggedInUser.org_id
    );

    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationsForSuperUser = async (filter, loggedInUser) => {
  try {
    let locations = await Location.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: Project,
          attributes: ["gid"],
          include: [
            {
              model: GlobalIdentifier,
              attributes: ["user_id", "privacy", "org_id"],
              include: [
                {
                  model: User,
                  attributes: ["user_id"],
                },
              ],
            },
          ],
        },
      ],
    });

    locations = locations.filter(
      async (location) =>
        location.Project.GlobalIdentifier.user_id === loggedInUser.user_id ||
        (location.Project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: location.Project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationsForUser = async (filter, loggedInUser) => {
  try {
    let locations = await Location.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
        {
          model: Project,
          attributes: ["gid"],
          include: [
            {
              model: GlobalIdentifier,
              attributes: ["user_id", "privacy", "org_id"],
              include: [
                {
                  model: User,
                  attributes: ["user_id"],
                },
              ],
            },
          ],
        },
      ],
    });

    locations = locations.filter(
      async (location) =>
        (location.Project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: location.Project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.deleteLocation = async (id) => {
  try {
    await Location.destroy({ where: { id } });
  } catch (e) {
    throw new Error(e.message);
  }
};

// exports.getLocationDataForUpload = async (id) => {
//   try {
//     if (!uuid.validate(id)) {
//       throw new Error("Invalid Id!");
//     }

//     const location = await this.findLocationById(id);
//     if (!location) {
//       throw new Error("Location doesn't exist!");
//     }

//     const project = await findProjectById(location.project_id);
//     const globalIdentifier = await findGlobalIdentifierById(project.gid);
//     const LOCs = await getLOCsByLocationId(id);

//     const singleLOCs = LOCs.filter((loc) => loc.LOC_type === "single");
//     const dualLOCs = LOCs.filter((loc) => loc.LOC_type === "dual");

//     return ({ location, project, globalIdentifier, singleLOCs, dualLOCs });
//   } catch (e) {
//     throw new Error(e.message);
//   }
// };
