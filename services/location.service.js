const Location = require("../models/location");

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
