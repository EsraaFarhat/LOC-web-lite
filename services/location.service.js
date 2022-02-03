const Location = require("../models/location");

exports.findLocationById = async (id) => {
  try {
    const location = await Location.findByPk(id);
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