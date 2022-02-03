const GlobalIdentifier = require("../models/globalidentifier");


exports.getAllGlobalIdentifiers = async () => {
  try {
    const globalIdentifiers = await GlobalIdentifier.findAll();
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