const _ = require("lodash");
const uuid = require("uuid");
const { log } = require("./log.controller");

const {
  findLOCByRouteId,
  validateLOC,
  validateLOCDestination,
  createLOC,
  createLOCDestination,
} = require("../services/LOC.service");
const { findLocationById } = require("../services/location.service");

exports.createLOCHandler = async (req, res) => {
  try {
    const locBody = {
      route_id: req.body.route_id,
      origin: req.body.origin,
      field_1: req.body.field_1,
      field_2: req.body.field_2,
      field_3: req.body.field_3,
      MISC: req.body.MISC,
      LOC_type: req.body.LOC_type,
      cable_status: req.body.cable_status,
      location_id: req.body.location_id,
    };
    const destinationBody = {
      destination: req.body.destination,
      destination_field_1: req.body.destination_field_1,
      destination_field_2: req.body.destination_field_2,
      destination_field_3: req.body.destination_field_3,
    };
    // validate the request
    const { error } = validateLOC(locBody);
    if (error) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to create LOC (Validation error)`,
        "POST",
        "error",
        400
      );
      return res.status(400).json({
        error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      });
    }
    // If the LOC is dual and has destination => validate the destination
    if (
      req.body.LOC_type === "dual" &&
      Object.values(destinationBody).filter((value) => value !== undefined)
        .length
    ) {
      const { error } = validateLOCDestination(destinationBody);
      if (error) {
        await log(
          req.user.user_id,
          req.user.fullName,
          null,
          `Failed to create dual LOC (Destination validation error)`,
          "POST",
          "error",
          400
        );
        return res.status(400).json({
          error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
        });
      }
    }

    // check if the route_id exists in database
    let loc = await findLOCByRouteId(req.body.route_id);
    if (loc) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to create LOC (route id already exists)`,
        "POST",
        "error",
        400
      );
      return res.status(400).json({ error: "This route id already exists!" });
    }

    // validate location_id [foreign key]
    if (
      !uuid.validate(req.body.location_id) ||
      !(await findLocationById(req.body.location_id))
    ) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to create LOC (Location doesn't exist)`,
        "POST",
        "error",
        404
      );
      return res
        .status(404)
        .json({ error: "Location with given id doesn't exist!" });
    }

    // Create the LOC
    const newLOC = await createLOC(locBody, req.user.user_id);

    // If the LOC is dual and has destination => create it
    let destination = {};
    if (
      req.body.LOC_type === "dual" &&
      Object.values(destinationBody).filter((value) => value !== undefined)
        .length
    ) {
      destination = await createLOCDestination(destinationBody, newLOC.loc_id);

      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Dual LOC has been created with data: ${JSON.stringify({
          ...newLOC.dataValues,
          ...destination.dataValues,
        })}`,
        "POST",
        "success",
        201
      );

      return res.status(201).json({
        message: "Dual LOC created successfully..",
        LOC: { ...newLOC.dataValues, ...destination.dataValues },
      });
    }

    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Single LOC has been created with data: ${JSON.stringify(newLOC)}`,
      "POST",
      "success",
      201
    );

    res.status(201).json({
      message: "Single LOC created successfully..",
      LOC: newLOC,
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to create LOC`,
      "POST",
      "error",
      500
    );

    res.status(500).json({ error: e.message });
  }
};
