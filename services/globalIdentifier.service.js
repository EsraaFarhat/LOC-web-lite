const GlobalIdentifier = require("../models/globalidentifier");

exports.getAllGlobalIdentifiers = async (filter) => {
  try {
    const globalIdentifiers = await GlobalIdentifier.findAll({
      where: filter,
    });
    return globalIdentifiers;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createGlobalIdentifier = async (request) => {
  try {
    const newGlobalIdentifier = await GlobalIdentifier.create(request);

    return newGlobalIdentifier;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateGlobalIdentifier = async (gid, request) => {
  try {
    const globalIdentifier = await GlobalIdentifier.update(request, {
      where: { gid },
      returning: true,
    });

    return globalIdentifier;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.findGlobalIdentifierById = async (gid) => {
  try {
    const globalIdentifier = await GlobalIdentifier.findOne({ where: { gid } });
    return globalIdentifier;
  } catch (e) {
    throw new Error(e.message);
  }
};
