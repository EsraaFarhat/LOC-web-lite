const GlobalIdentifier = require("../models/globalidentifier");
const User = require("../models/user");
const UserGlobalIdentifier = require("../models/userGlobalidentifier");

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

exports.getGlobalIdentifiersForSuperAdmin = async (filter, loggedInUser) => {
  try {
    let globalIdentifiers1 = await GlobalIdentifier.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });

    globalIdentifiers1 = globalIdentifiers1.filter(
      (gid) =>
        gid.User.user_id === loggedInUser.user_id ||
        gid.org_id === loggedInUser.org_id
    );
    return [...globalIdentifiers1];
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getGlobalIdentifiersForSuperUser = async (filter, loggedInUser) => {
  try {
    let globalIdentifiers1 = await GlobalIdentifier.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });
    let globalIdentifiers2 = await this.getAllGlobalIdentifiersUserAssignedTo({
      user_id: loggedInUser.user_id,
    });

    if (filter.name) {
      if (filter.name.logic) filter.name = filter.name.logic.split("%")[1];
      globalIdentifiers2 = globalIdentifiers2.filter(
        (gid) => gid.name.indexOf(filter.name) > -1
      );
    }

    globalIdentifiers1 = globalIdentifiers1.filter(
      (gid) =>
        gid.User.user_id === loggedInUser.user_id ||
        (gid.org_id === loggedInUser.org_id && gid.privacy === "public")
    );
    return [...globalIdentifiers1, ...globalIdentifiers2];
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getGlobalIdentifiersForUser = async (filter, loggedInUser) => {
  try {
    let globalIdentifiers1 = await GlobalIdentifier.findAll({
      where: filter,
      include: [
        {
          model: User,
        },
      ],
    });

    const globalIdentifiers2 = await this.getAllGlobalIdentifiersUserAssignedTo(
      { user_id: loggedInUser.user_id }
    );

    if (filter.name) {
      if (filter.name.logic) filter.name = filter.name.logic.split("%")[1];
      globalIdentifiers2 = globalIdentifiers2.filter(
        (gid) => gid.name.indexOf(filter.name) > -1
      );
    }

    globalIdentifiers1 = globalIdentifiers1.filter(
      (gid) => gid.org_id === loggedInUser.org_id && gid.privacy === "public"
    );

    return [...globalIdentifiers1, ...globalIdentifiers2];
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

exports.findUserAssignedToGlobalIdentifier = async (filter) => {
  try {
    const user = await UserGlobalIdentifier.findOne({
      where: filter,
      include: [
        {
          model: GlobalIdentifier,
        },
      ],
    });
    return user;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getAllUsersAssignedToGlobalIdentifier = async (filter) => {
  return new Promise(async (resolve, reject) => {
    let users = await UserGlobalIdentifier.findAll({
      where: filter,
      attributes: ["gid"],
      include: [
        {
          model: User,
          attributes: ["user_id", "fullName", "email", "role"],
        },
      ],
    });

    let usersArray = [];
    const promises = users.map((user) => {
      return new Promise(async (res, rej) => {
        usersArray.push(user.User);
        res();
      });
    });
    Promise.all(promises).then(() => {
      return resolve({ usersArray });
    });
  });
};

exports.getAllGlobalIdentifiersUserAssignedTo = async (filter) => {
  return new Promise(async (resolve, reject) => {
    let globalIdentifiers = await UserGlobalIdentifier.findAll({
      where: filter,
      attributes: ["gid"],
      include: [
        {
          model: GlobalIdentifier,
        },
      ],
    });

    let globalIdentifiersArray = [];
    const promises = globalIdentifiers.map((gid) => {
      return new Promise(async (res, rej) => {
        globalIdentifiersArray.push(gid.GlobalIdentifier);
        res();
      });
    });
    Promise.all(promises).then(() => {
      return resolve(globalIdentifiersArray);
    });
  });
};
