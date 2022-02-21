const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");

const LOC = require("../models/LOC");
const LOCDestination = require("../models/LOC_destination");

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

exports.getLOC = async (loc_id) => {
  try {
    const loc = await LOC.findOne({
      where: { loc_id },
      include: [
        {
          model: LOCDestination,
        },
      ],
    });
    return loc;
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

exports.validateLOC = (loc) => {
  const schema = Joi.object({
    route_id: Joi.string().trim().max(100).required(),
    origin: Joi.string().trim().max(100).required(),
    field_1: Joi.string().trim().max(200).required(),
    field_2: Joi.string().trim().max(200).required(),
    field_3: Joi.string().trim().max(200).required(),
    MISC: Joi.string().trim().max(100).required(),
    LOC_type: Joi.string().trim().valid("single", "dual").required(),
    cable_status: Joi.string().trim().valid("assigned", "unassigned"),
    location_id: Joi.string().trim().required(),
  });
  return schema.validate(loc, { abortEarly: false });
};

exports.validateLOCDestination = (LOCDestination) => {
  const schema = Joi.object({
    destination: Joi.string().trim().max(100).required(),
    destination_field_1: Joi.string().trim().max(200).required(),
    destination_field_2: Joi.string().trim().max(200).required(),
    destination_field_3: Joi.string().trim().max(200).required(),
  });
  return schema.validate(LOCDestination, { abortEarly: false });
};
