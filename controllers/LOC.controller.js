const _ = require("lodash");
const uuid = require("uuid");
const { log } = require("./log.controller");

const {
  findLOCByRouteId,
  findLOCById,
  validateLOC,
  validateLOCDestination,
  createLOC,
  createLOCDestination,
  validateUpdateLOC,
  validateUpdateLOCDestination,
  updateLOC,
  updateLOCDestination,
} = require("../services/LOC.service");
const { findLocationById } = require("../services/location.service");
const { UserLoginToMainServerHandler } = require("../services/user.service");

exports.createLOCHandler = async (req, res) => {
  try {
    //            ****************Main server*****************
    if (req.query.mode === "main") {
      let response = await UserLoginToMainServerHandler(
        req.user.email,
        req.user.password
      );
      if (response.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: response.error,
        });
      }

      response = await fetch(
        `${process.env.EC2_URL}/api/LOCs`,
        {
          method: "post",
          body: JSON.stringify(req.body),
          headers: {
            Authorization: `Bearer ${req.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }

      return res.json({ message: data.message, loc: data.Loc });
    }

    //            ****************Local server*****************
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
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      radius: req.body.radius,
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
        req.user.fupatchllName,
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
      `LOC has been created with data: ${JSON.stringify(newLOC)}`,
      "POST",
      "success",
      201
    );

    res.status(201).json({
      message: "LOC created successfully..",
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

exports.updateLOCHandler = async (req, res) => {
  try {
    // if (!uuid.validate(req.params.id)) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to update LOC with id (${req.params.id}) (Invalid ID)`,
    //     "PATCH",
    //     "error",
    //     400
    //   );
    //   return res.status(400).json({ error: "Invalid Id!" });
    // }

    const id = req.params.id;

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      let response = await UserLoginToMainServerHandler(
        req.user.email,
        req.user.password
      );
      if (response.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: response.error,
        });
      }

      response = await fetch(
        `${process.env.EC2_URL}/api/LOCs/${id}`,
        {
          method: "patch",
          body: JSON.stringify(req.body),
          headers: {
            Authorization: `Bearer ${req.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.error) {
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }

      return res.json({ message: data.message, loc: data.loc });
    }

    //            ****************Local server*****************
    let loc = req.locToUpdate;

    // check if the LOC exists in database
    // let loc = await findLOCById(id);

    // if (!loc) {
    //   await log(
    //     req.user.user_id,
    //     req.user.fullName,
    //     null,
    //     `Failed to update LOC with id (${id}) (doesn't exist)`,
    //     "PATCH",
    //     "error",
    //     404
    //   );
    //   return res.status(404).json({ error: "LOC doesn't exist!" });
    // }
    if (!Object.keys(req.body).length) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Nothing to update in this LOC`,
        "PATCH",
        "info",
        200
      );
      return res.json({ message: "There is nothing to update!" });
    }

    if (req.body.route_id) {
      // check if the route_id exists in database
      let loc2 = await findLOCByRouteId(req.body.route_id);
      if (loc2 && loc2.loc_id != id) {
        await log(
          req.user.user_id,
          req.user.fullName,
          null,
          `Failed to update LOC (route id already exists)`,
          "PATCH",
          "error",
          400
        );
        return res
          .status(400)
          .json({ error: "This Route Id already exists, try another one!" });
      }
    }

    const locBody = {
      route_id: req.body.route_id,
      origin: req.body.origin,
      field_1: req.body.field_1,
      field_2: req.body.field_2,
      field_3: req.body.field_3,
      MISC: req.body.MISC,
      cable_status: req.body.cable_status,
    };
    const destinationBody = {
      destination: req.body.destination,
      destination_field_1: req.body.destination_field_1,
      destination_field_2: req.body.destination_field_2,
      destination_field_3: req.body.destination_field_3,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      radius: req.body.radius,
    };

    // validate the request first
    let updatedLOC;
    const { error } = validateUpdateLOC(locBody);
    if (error) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to update LOC (Validation error)`,
        "PATCH",
        "error",
        400
      );
      return res.status(400).json({
        error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      });
    }
    if(!locBody.sync) locBody.sync = false;
    updatedLOC = await updateLOC(id, locBody);

    if (loc.LOC_type === "dual" && Object.keys(destinationBody).length) {
      const { error } = validateUpdateLOCDestination(destinationBody);
      if (error) {
        await log(
          req.user.user_id,
          req.user.fullName,
          null,
          `Failed to update dual LOC (Destination validation error)`,
          "PATCH",
          "error",
          400
        );
        return res.status(400).json({
          error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
        });
      }

    if(!destinationBody.destination_sync) destinationBody.destination_sync = false;
      const updatedDestination = await updateLOCDestination(
        id,
        destinationBody
      );

      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Update dual LOC (${id}) with data ${JSON.stringify(req.body)}`,
        "PATCH",
        "success",
        200
      );

      if (updatedLOC[1]) {
        return res.json({
          message: "Dual LOC updated successfully..",
          loc: {
            ...updatedLOC[1][0].dataValues,
            ...updatedDestination[1][0].dataValues,
          },
        });
      } else {
        return res.json({
          message: "Dual LOC updated successfully..",
          loc: {
            ...loc.dataValues,
            ...updatedDestination[1][0].dataValues,
          },
        });
      }
    }

    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Update LOC (${id}) with data ${JSON.stringify(req.body)}`,
      "PATCH",
      "success",
      200
    );

    res.json({
      message: "LOC updated successfully..",
      loc: updatedLOC[1][0].dataValues,
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to update LOC`,
      "PATCH",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
