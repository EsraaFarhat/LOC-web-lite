const Location = require("../models/location");

exports.findLocationById = async (id) => {
  try {
    const location = await Location.findByPk(id);
    return location;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLocationsForProject = async (project_id) => {
  try {
    const locations = await Location.findAll({ where: { project_id } });
    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};