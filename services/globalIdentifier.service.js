const GlobalIdentifier = require("../models/globalidentifier");
const User = require("../models/user");

exports.findGlobalIdentifier = async (name) => {
  try {
    const globalIdentifier = await GlobalIdentifier.findOne({
      where: { name },
    });

    return globalIdentifier;
  } catch (e) {
    throw new Error(e.message);
  }
};

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

exports.getGlobalIdentifiersForSuperUser = async (filter, loggedInUser) => {
  try {
    const globalIdentifiers = await GlobalIdentifier.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });
    return globalIdentifiers.filter(
      (gid) =>
        gid.User.user_id === loggedInUser.user_id ||
        gid.User.sup_id === loggedInUser.user_id
    );
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getGlobalIdentifiersForUser = async (filter, loggedInUser) => {
  try {
    const globalIdentifiers = await GlobalIdentifier.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });
    return globalIdentifiers.filter(
      (gid) =>
        gid.User.user_id === loggedInUser.user_id ||
        gid.User.sup_id === loggedInUser.sup_id ||
        gid.User.user_id === loggedInUser.sup_id
    );
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getGlobalIdentifierWithUser = async (gid) => {
  try {
    const globalIdentifier = await GlobalIdentifier.findOne({
      where: { gid },
      include: [
        {
          model: User,
        },
      ],
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
exports.deleteGlobalIdentifier = async (gid) => {
  try {
    await GlobalIdentifier.destroy({
      where: {
        gid,
      },
    });
  } catch (e) {
    throw new Error(e.message);
  }
};

