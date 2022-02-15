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

exports.findGlobalIdentifierById = async (gid) => {
  try {
    const globalIdentifier = await GlobalIdentifier.findOne({ where: { gid } });
    return globalIdentifier;
  } catch (e) {
    throw new Error(e.message);
  }
};
