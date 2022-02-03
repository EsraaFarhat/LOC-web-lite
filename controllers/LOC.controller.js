const _ = require("lodash");
const uuid = require("uuid");
const sequelize = require("../db");

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
      return res.status(400).json({
        error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      });
    }
    // If the LOC is dual and has destination => validate the destination
    if (req.body.LOC_type === "dual" && Object.values(destinationBody).filter((value) => value !== undefined).length) {
      const { error } = validateLOCDestination(destinationBody);
      if (error) {
        return res.status(400).json({
          error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
        });
      }
    }

    // check if the route_id exists in database
    let loc = await findLOCByRouteId(req.body.route_id);
    if (loc)
      return res.status(400).json({ error: "This route id already exists!" });

    // validate location_id [foreign key]
    if (
      !uuid.validate(req.body.location_id) ||
      !(await findLocationById(req.body.location_id))
    ) {
      return res
        .status(404)
        .json({ error: "Location with given id doesn't exist!" });
    }

    // Create the LOC
    const newLOC = await createLOC(locBody, req.user);

    // If the LOC is dual and has destination => create it
    let destination = {};
    if (req.body.LOC_type === "dual" && req.body.destination) {
      destination = await createLOCDestination(destinationBody, newLOC.loc_id);
    }

    res.status(201).json({
      message: "LOC created successfully..",
      LOC: { ...newLOC.dataValues, ...destination.dataValues },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
