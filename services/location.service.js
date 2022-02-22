const uuid = require("uuid");

const Location = require("../models/location");
const { findProjectById } = require("../services/project.service");
const {
  findGlobalIdentifierById,
} = require("../services/globalIdentifier.service");
const { getLOCsByLocationId } = require("../services/LOC.service");

exports.findLocationById = async (id) => {
  try {
    const location = await Location.findByPk(id);
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

exports.getLocationDataForUpload = async (id) => {
  try {
    if (!uuid.validate(id)) {
      throw new Error("Invalid Id!");
    }

    const location = await this.findLocationById(id);
    if (!location) {
      throw new Error("Location doesn't exist!");
    }

    const project = await findProjectById(location.project_id);
    const globalIdentifier = await findGlobalIdentifierById(project.gid);
    const LOCs = await getLOCsByLocationId(id);

    const singleLOCs = LOCs.filter((loc) => loc.LOC_type === "single");
    const dualLOCs = LOCs.filter((loc) => loc.LOC_type === "dual");

    return ({ location, project, globalIdentifier, singleLOCs, dualLOCs });
  } catch (e) {
    throw new Error(e.message);
  }
};
