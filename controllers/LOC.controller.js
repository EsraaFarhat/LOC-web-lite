const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { log } = require("./log.controller");

const {
  validateLOC,
  validateLOCDestination,
  createLOC,
  createLOCDestination,
  validateUpdateLOC,
  validateUpdateLOCDestination,
  updateLOC,
  updateLOCDestination,
  getLOCsForSuperUser,
  getLOCsForUser,
} = require("../services/LOC.service");

exports.createLOCHandler = async (req, res) => {
  const gid = req.body.gid ? req.body.gid : null;
  try {
    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(`${process.env.EC2_URL}/api/LOCs`, {
        method: "post",
        body: JSON.stringify(req.body),
        headers: {
          Authorization: `Bearer ${req.user.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to Create LOC on main server`,
          "POST"
        );
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }

      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Create LOC on main server`,
        "POST"
      );
      return res.json({ message: data.message, loc: data.Loc });
    }
  } catch (e) {
    console.log(e);
    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `Failed to create LOC`,
      "POST"
    );

    res.status(500).json({ error: e.message });
  }

  //            ****************Local server*****************
  try {
    const locBody = {
      route_id: req.body.route_id,
      origin: req.body.origin,
      field_1: req.body.field_1,
      field_2: req.body.field_2,
      field_3: req.body.field_3,
      MISC: req.body.MISC,
      LOC_type: req.body.LOC_type,
      origin_status: req.body.origin_status,
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
      destination_status: req.body.destination_status,
    };
    // validate the request
    const { error } = validateLOC(locBody);
    if (error) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to create LOC on local server (Validation error)`,
        "POST"
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
          req.user.email,
          gid,
          `Failed to create dual LOC on local server (Destination validation error)`,
          "POST"
        );
        return res.status(400).json({
          error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
        });
      }
    }

    // LOC route_id should be unique for every company
    let loc = [];
    // if (req.user.role === "admin") {
    //   loc = await getLOCsForAdmin({
    //     route_id: req.body.route_id,
    //     location_id: req.body.location_id,
    //   });
    // } else
    if (req.user.role === "super user") {
      loc = await getLOCsForSuperUser(
        { route_id: req.body.route_id, location_id: req.body.location_id },
        req.user
      );
    } else if (req.user.role === "user") {
      loc = await getLOCsForUser(
        { route_id: req.body.route_id, location_id: req.body.location_id },
        req.user
      );
    }

    if (loc.length !== 0) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to create LOC (route id already exists)`,
        "POST"
      );

      return res.status(400).json({ error: "This route id already exists!" });
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
        req.user.email,
        null,
        `Dual LOC has been created on local server with data: ${JSON.stringify({
          ...newLOC.dataValues,
          ...destination.dataValues,
        })}`,
        "POST"
      );

      return res.status(201).json({
        message: "Dual LOC created successfully..",
        LOC: { ...newLOC.dataValues, ...destination.dataValues },
      });
    }

    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `LOC has been created on local server with data: ${JSON.stringify(
        newLOC
      )}`,
      "POST"
    );

    res.status(201).json({
      message: "LOC created successfully..",
      LOC: newLOC,
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `Failed to create LOC`,
      "POST"
    );

    res.status(500).json({ error: e.message });
  }
};

exports.updateLOCHandler = async (req, res) => {
  const gid = req.body.gid ? req.body.gid : null;
  try {
    const id = req.params.id;

    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(`${process.env.EC2_URL}/api/LOCs/${id}`, {
        method: "patch",
        body: JSON.stringify(req.body),
        headers: {
          Authorization: `Bearer ${req.user.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to Update LOC on main server`,
          "PATCH"
        );
        return res.status(400).json({
          error: "Cannot do this operation on the main server!",
          reason: data.error,
        });
      }

      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Update LOC on main server`,
        "PATCH"
      );
      return res.json({ message: data.message, loc: data.loc });
    }

    //            ****************Local server*****************
    let loc = req.locToUpdate;

    if (!Object.keys(req.body).length) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Nothing to update in this LOC on local server`,
        "PATCH"
      );
      return res.json({ message: "There is nothing to update!" });
    }

    if (req.body.route_id) {
      // check if the route_id exists in database
      let locByRouteID = [];
      // if (req.user.role === "admin") {
      //   locByRouteID = await getLOCsForAdmin({
      //     route_id: req.body.route_id,
      //     location_id: loc.location_id,
      //   });
      // } else
      if (req.user.role === "super user") {
        locByRouteID = await getLOCsForSuperUser(
          { route_id: req.body.route_id, location_id: loc.location_id },
          req.user
        );
      } else if (req.user.role === "user") {
        locByRouteID = await getLOCsForUser(
          { route_id: req.body.route_id, location_id: loc.location_id },
          req.user
        );
      }
      if (locByRouteID.length !== 0 && locByRouteID[0].loc_id !== id) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to update LOC (Name already exists)`,
          "POST"
        );

        return res
          .status(400)
          .json({ error: "This name already exists, try another one!" });
      }
    }

    const locBody = {
      route_id: req.body.route_id,
      origin: req.body.origin,
      field_1: req.body.field_1,
      field_2: req.body.field_2,
      field_3: req.body.field_3,
      MISC: req.body.MISC,
      origin_status: req.body.origin_status,
    };
    const destinationBody = {
      destination: req.body.destination,
      destination_field_1: req.body.destination_field_1,
      destination_field_2: req.body.destination_field_2,
      destination_field_3: req.body.destination_field_3,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      radius: req.body.radius,
      destination_status: req.body.destination_status,
    };

    // validate the request first
    let updatedLOC;
    const { error } = validateUpdateLOC(locBody);
    if (error) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to update LOC on local server (Validation error)`,
        "PATCH"
      );
      return res.status(400).json({
        error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      });
    }
    if (!locBody.sync) locBody.sync = false;
    updatedLOC = await updateLOC(id, locBody);

    if (loc.LOC_type === "dual" && Object.keys(destinationBody).length) {
      const { error } = validateUpdateLOCDestination(destinationBody);
      if (error) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to update dual LOC on local server (Destination validation error)`,
          "PATCH"
        );
        return res.status(400).json({
          error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
        });
      }

      if (!destinationBody.destination_sync)
        destinationBody.destination_sync = false;
      const updatedDestination = await updateLOCDestination(
        id,
        destinationBody
      );

      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Update dual LOC (${id}) on local server with data ${JSON.stringify(
          req.body
        )}`,
        "PATCH"
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
      req.user.email,
      gid,
      `Update LOC (${id}) on local server with data ${JSON.stringify(
        req.body
      )}`,
      "PATCH"
    );

    if (updatedLOC[1]) {
      return res.json({
        message: "LOC updated successfully..",
        loc: updatedLOC[1][0].dataValues,
      });
    }
    res.json({
      message: "LOC updated successfully..",
      loc: loc.dataValues,
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `Failed to update LOC`,
      "PATCH"
    );
    res.status(500).json({ error: e.message });
  }
};
