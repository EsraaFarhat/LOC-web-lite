const Location = require("../models/location");

exports.getLocationsForProject = async (project_id) => {
  try {
    const locations = await Location.findAll({ where: { project_id } });
    return locations;
  } catch (e) {
    throw new Error(e.message);
  }
};