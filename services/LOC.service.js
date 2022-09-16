const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");

const LOC = require("../models/LOC");
const LOCDestination = require("../models/LOC_destination");
const User = require("../models/user");
const Location = require("../models/location");
const {
  findUserAssignedToGlobalIdentifier,
} = require("./globalIdentifier.service");
const Project = require("../models/project");
const GlobalIdentifier = require("../models/globalidentifier");

exports.findLOCById = async (id) => {
  try {
    const loc = await LOC.findOne({ where: { loc_id: id } });

    return loc;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.findLOCByRouteId = async (route_id) => {
  try {
    const loc = await LOC.findOne({ where: { route_id } });

    return loc;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLOCWithUser = async (loc_id) => {
  try {
    const loc = await LOC.findOne({
      where: { loc_id },
      include: [
        {
          model: LOCDestination,
        },
        {
          model: User,
        },
        {
          model: Location,
          include: [
            {
              model: Project,
              attributes: ["gid"],
              include: [
                {
                  model: GlobalIdentifier,
                  attributes: ["user_id", "privacy", "org_id"],
                  include: [
                    {
                      model: User,
                      attributes: ["user_id"],
                    },
                  ],
                },
              ],
            },
          ],
          // required: true,
        },
      ],
    });
    return loc;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLOC = async (loc_id) => {
  try {
    const loc = await LOC.findOne({
      where: { loc_id },
      include: [
        {
          model: LOCDestination,
        },
        {
          model: Location,
        },
      ],
    });
    return loc;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLOCsForSuperAdmin = async (filter, loggedInUser, order) => {
  try {
    if (order === "") order = "createdAt";
    let type = order === "route_id" ? "ASC" : "DESC";

    let locs = await LOC.findAll({
      where: filter,
      include: [
        {
          model: LOCDestination,
          // required: true,
        },
        {
          model: User,
          // required: true,
        },
        {
          model: Location,
          include: [
            {
              model: Project,
              attributes: ["gid"],
              include: [
                {
                  model: GlobalIdentifier,
                  attributes: ["user_id", "privacy"],
                  include: [
                    {
                      model: User,
                      attributes: ["user_id"],
                    },
                  ],
                },
              ],
            },
          ],
          // required: true,
        },
      ],
      order: [[order, type]],
    });

    locs = locs.filter(
      async (loc) =>
        loc.Location.Project.GlobalIdentifier.org_id === loggedInUser.org_id
    );

    return locs;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLOCsForSuperUser = async (filter, loggedInUser, order) => {
  try {
    if (order === "") order = "createdAt";
    let type = order === "route_id" ? "ASC" : "DESC";

    let locs = await LOC.findAll({
      where: filter,
      include: [
        {
          model: LOCDestination,
          // required: true,
        },
        {
          model: User,
          // required: true,
        },
        {
          model: Location,
          include: [
            {
              model: Project,
              attributes: ["gid"],
              include: [
                {
                  model: GlobalIdentifier,
                  attributes: ["user_id", "privacy"],
                  include: [
                    {
                      model: User,
                      attributes: ["user_id"],
                    },
                  ],
                },
              ],
            },
          ],
          // required: true,
        },
      ],
      order: [[order, type]],
    });

    locs = locs.filter(
      async (loc) =>
        loc.Location.Project.GlobalIdentifier.user_id ===
          loggedInUser.user_id ||
        (loc.Location.Project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return locs;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getLOCsForUser = async (filter, loggedInUser, order) => {
  try {
    if (order === "") order = "createdAt";
    let type = order === "route_id" ? "ASC" : "DESC";

    let locs = await LOC.findAll({
      where: filter,
      include: [
        {
          model: LOCDestination,
          // required: true,
        },
        {
          model: User,
          // required: true,
        },
        {
          model: Location,
          include: [
            {
              model: Project,
              attributes: ["gid"],
              include: [
                {
                  model: GlobalIdentifier,
                  attributes: ["user_id", "privacy"],
                  include: [
                    {
                      model: User,
                      attributes: ["user_id"],
                    },
                  ],
                },
              ],
            },
          ],
          // required: true,
        },
      ],
      order: [[order, type]],
    });

    locs = locs.filter(
      async (loc) =>
        (loc.Location.Project.GlobalIdentifier.org_id === loggedInUser.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: loggedInUser.user_id,
        }))
    );

    return locs;
    // );
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createLOC = async (request, user_id) => {
  try {
    const newLOC = await LOC.create({
      ...request,
      // origin_id: uuidv4(),
      user_id, // the logged in user
    });
    return newLOC;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createLOCDestination = async (destinationRequest, loc_id) => {
  try {
    const destination = await LOCDestination.create({
      ...destinationRequest,
      // destination_id: uuidv4(),
      loc_id,
    });
    return destination;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateLOC = async (id, request) => {
  try {
    const loc = await LOC.update(request, {
      where: { loc_id: id },
      returning: true,
    });

    return loc;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateLOCDestination = async (loc_id, request) => {
  try {
    const locDestination = await LOCDestination.update(request, {
      where: { loc_id },
      returning: true,
    });

    return locDestination;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.deleteLOC = async (id) => {
  try {
    await LOC.destroy({ where: { loc_id: id } });
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.validateLOC = (loc) => {
  const schema = Joi.object({
    route_id: Joi.string().trim().max(100).required(),
    origin: Joi.string().trim().max(100).required(),
    field_1: Joi.string().trim().max(200).required(),
    field_2: Joi.string().trim().max(200).required(),
    field_3: Joi.string().trim().max(200).required(),
    MISC: Joi.string().trim().max(100).allow(null, ""),
    LOC_type: Joi.string().trim().valid("single", "dual").required(),
    origin_status: Joi.string().trim().valid("assigned", "unassigned"),
    location_id: Joi.string().trim().required(),
    gid: Joi.string().trim(),
  });
  return schema.validate(loc, { abortEarly: false });
};

exports.validateUpdateLOC = (loc) => {
  const schema = Joi.object({
    route_id: Joi.string().trim().max(100),
    origin: Joi.string().trim().max(100),
    field_1: Joi.string().trim().max(200),
    field_2: Joi.string().trim().max(200),
    field_3: Joi.string().trim().max(200),
    MISC: Joi.string().trim().max(100).allow(null, ""),
    origin_status: Joi.string().trim().valid("assigned", "unassigned"),
    gid: Joi.string().trim(),
  });
  return schema.validate(loc, { abortEarly: false });
};

exports.validateLOCDestination = (LOCDestination) => {
  const schema = Joi.object({
    destination: Joi.string().trim().max(100).required(),
    destination_field_1: Joi.string().trim().max(200).required(),
    destination_field_2: Joi.string().trim().max(200).required(),
    destination_field_3: Joi.string().trim().max(200).required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
    radius: Joi.number().required(),
    destination_status: Joi.string().trim().valid("assigned", "unassigned"),
  });
  return schema.validate(LOCDestination, { abortEarly: false });
};

exports.validateUpdateLOCDestination = (LOCDestination) => {
  const schema = Joi.object({
    destination: Joi.string().trim().max(100),
    destination_field_1: Joi.string().trim().max(200),
    destination_field_2: Joi.string().trim().max(200),
    destination_field_3: Joi.string().trim().max(200),
    longitude: Joi.number(),
    latitude: Joi.number(),
    radius: Joi.number(),
    destination_status: Joi.string().trim().valid("assigned", "unassigned"),
  });
  return schema.validate(LOCDestination, { abortEarly: false });
};

exports.getLOCsByLocationId = async (location_id, loggedInUser, order) => {
  try {
    if (order === "") order = "createdAt";
    let type = order === "route_id" ? "ASC" : "DESC";

    let LOCs = await LOC.findAll({
      where: { location_id },
      include: [
        {
          model: LOCDestination,
          // required: true,
        },
        {
          model: Location,
          include: [
            {
              model: Project,
              attributes: ["gid"],
              include: [
                {
                  model: GlobalIdentifier,
                  attributes: ["user_id", "privacy", "org_id"],
                  include: [
                    {
                      model: User,
                      attributes: ["user_id"],
                    },
                  ],
                },
              ],
            },
          ],
          // required: true,
        },
        {
          model: User,
          // required: true,
        },
      ],
      order: [[order, type]],
    });
    if (loggedInUser.role === "super admin") {
      return (LOCs = LOCs.filter(
        async (loc) =>
          loc.Location.Project.GlobalIdentifier.org_id === loggedInUser.org_id
      ));
    } else if (loggedInUser.role === "super user") {
      return LOCs.filter(
        async (loc) =>
          loc.Location.Project.GlobalIdentifier.user_id ===
            loggedInUser.user_id ||
          (loc.Location.Project.GlobalIdentifier.org_id ===
            loggedInUser.org_id &&
            loc.Location.Project.GlobalIdentifier.privacy === "public") ||
          (await findUserAssignedToGlobalIdentifier({
            gid: loc.Location.Project.gid,
            user_id: loggedInUser.user_id,
          }))
      );
    } else if (loggedInUser.role === "user") {
      return (LOCs = LOCs.filter(
        async (loc) =>
          (loc.Location.Project.GlobalIdentifier.org_id ===
            loggedInUser.org_id &&
            loc.Location.Project.GlobalIdentifier.privacy === "public") ||
          (await findUserAssignedToGlobalIdentifier({
            gid: loc.Location.Project.gid,
            user_id: loggedInUser.user_id,
          }))
      ));
    }
    return LOCs;
  } catch (e) {
    throw new Error(e.message);
  }
};
