const uuid = require("uuid");
const _ = require("lodash");
const xlsx = require("xlsx");
// const FormData = require('form-data');
// const fs = require('fs');

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { log } = require("./log.controller");
const sequelize = require("../db/postgres/db");

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
  getLOCsForSuperAdmin,
} = require("../services/LOC.service");
const {
  findLocationById,
  getLocationWithUser,
  getLocationsForSuperAdmin,
} = require("../services/location.service");
const {
  findProjectById,
  getProjectWithUser,
} = require("../services/project.service");
const {
  getGlobalIdentifierWithUser,
  findUserAssignedToGlobalIdentifier,
} = require("../services/globalIdentifier.service");
const { EC2_URL } = require("../EC2_url");

exports.getLOCsHandler = async (req, res) => {
  try {
    const location_id = req.params.id;
    const cable_status = req.params.cable_status;

    let location = req.locationToGet;
    let project = await findProjectById(location.project_id);
    let globalIdentifier = _.pick(project, [
      "GlobalIdentifier.gid",
      "GlobalIdentifier.name",
      "GlobalIdentifier.privacy",
    ]).GlobalIdentifier;
    project = _.pick(project, ["id", "name"]);
    location = _.pick(location, ["id", "name"]);

    if (cable_status !== "assigned" && cable_status !== "unassigned") {
      await log(
        req.user.user_id,
        req.user.email,
        globalIdentifier.gid,
        `Failed to get LOCs for location (${location_id}) [invalid cable_status]`,
        "GET"
      );
      return res
        .status(400)
        .json({ error: "Cable Status must be one of [assigned, unassigned]!" });
    }

    let filter = {};
    filter.location_id = location_id;
    if (req.query.route_id) {
      filter.route_id = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("route_id")),
        "LIKE",
        "%" + req.query.route_id.toLowerCase() + "%"
      );
    }

    let order = "";
    if (
      req.query.order_by === "route_id" ||
      req.query.order_by === "createdAt"
    ) {
      order = req.query.order_by;
    }

    let LOCs;
    // if (req.user.role === "admin") {
    //   LOCs = await getLOCs(filter);
    // } else
    if (req.user.role === "super admin") {
      LOCs = await getLOCsForSuperAdmin(filter, req.user, order);
    } else if (req.user.role === "super user") {
      LOCs = await getLOCsForSuperUser(filter, req.user, order);
    } else if (req.user.role === "user") {
      LOCs = await getLOCsForUser(filter, req.user, order);
    }

    let singleLOCs = LOCs.filter((loc) => {
      loc.cable_status = cable_status;
      return loc.LOC_type === "single" && loc.origin_status === cable_status;
    });
    let dualLOCs = LOCs.filter((loc) => {
      loc.cable_status = cable_status;
      if (loc.LOCDestination) {
        let bool_cable_status = false,
          origin_status = false,
          destination_status = false;
        if (cable_status === "assigned") bool_cable_status = true;
        if (loc.origin_status === "assigned") origin_status = true;
        if (loc.LOCDestination.destination_status === "assigned")
          destination_status = true;

        return (
          loc.LOC_type === "dual" &&
          (origin_status && destination_status) === bool_cable_status
        );
      }
      return loc.LOC_type === "dual" && loc.cable_status === cable_status;
    });

    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      `Fetch All ${cable_status} LOCs for location (${location_id})`,
      "GET"
    );

    res.json({
      singleLOCs: _.map(singleLOCs, (loc) =>
        _.pick(loc, [
          "loc_id",
          "route_id",
          "origin_id",
          "origin",
          "field_1",
          "field_2",
          "field_3",
          "MISC",
          "origin_status",
          "cable_status",
          "LOC_type",
          "createdAt",
          "updatedAt",
          "Location.longitude",
          "Location.latitude",
          "Location.radius",
          "User.email",
          "User.fullName",
        ])
      ),
      dualLOCs: _.map(dualLOCs, (loc) =>
        _.pick(loc, [
          "loc_id",
          "route_id",
          "origin_id",
          "origin",
          "field_1",
          "field_2",
          "field_3",
          "MISC",
          "origin_status",
          "cable_status",
          "LOC_type",
          "createdAt",
          "updatedAt",
          "Location.longitude",
          "Location.latitude",
          "Location.radius",
          "LOCDestination.destination_id",
          "LOCDestination.destination",
          "LOCDestination.destination_field_1",
          "LOCDestination.destination_field_2",
          "LOCDestination.destination_field_3",
          "LOCDestination.longitude",
          "LOCDestination.latitude",
          "LOCDestination.radius",
          "LOCDestination.destination_status",
          "User.email",
          "User.fullName",
        ])
      ),
      location,
      project,
      globalIdentifier,
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to get LOCs for location (${req.params.location_id})`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.getLOCHandler = async (req, res) => {
  try {
    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(`${EC2_URL}/api/LOCs/${req.params.id}`, {
        headers: {
          Authorization: `Bearer ${req.user.token}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        await log(
          req.user.user_id,
          req.user.email,
          null,
          `Failed to fetch LOC with id ${req.params.id} from main server`,
          "GET"
        );
        return res.status(400).json({
          error: "Cannot do this operation on the main server; " + data.error,
        });
      }
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Get LOC with id ${req.params.id} from main server`,
        "GET"
      );
      return res.json({
        loc: data.loc,
        location: data.location,
        project: data.project,
        globalIdentifier: data.globalIdentifier,
      });
    }
    //            ****************Local server*****************
    const id = req.params.id;
    let loc = req.locToGet;
    let location = await findLocationById(loc.location_id);
    let project = await findProjectById(location.project_id);
    let globalIdentifier = _.pick(project, [
      "GlobalIdentifier.gid",
      "GlobalIdentifier.name",
      "GlobalIdentifier.privacy",
    ]).GlobalIdentifier;
    project = _.pick(project, ["id", "name"]);
    location = _.pick(location, ["id", "name"]);

    loc = _.pick(loc, [
      "loc_id",
      "route_id",
      "origin_id",
      "origin",
      "field_1",
      "field_2",
      "field_3",
      "MISC",
      "origin_status",
      "cable_status",
      "LOC_type",
      "createdAt",
      "updatedAt",
      "Location.longitude",
      "Location.latitude",
      "Location.radius",
      "LOCDestination",
      "User.user_id",
    ]);

    if (loc.LOC_type === "dual" && loc.LOCDestination) {
      let bool_cable_status = false,
        origin_status = false,
        destination_status = false;
      if (loc.origin_status === "assigned") origin_status = true;
      if (loc.LOCDestination.destination_status === "assigned")
        destination_status = true;

      bool_cable_status = origin_status && destination_status;
      if (bool_cable_status) loc.cable_status = "assigned";
      else loc.cable_status = "unassigned";
    } else loc.cable_status = loc.origin_status;

    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      `Fetch LOC (${id})`,
      "GET"
    );

    res.json({ loc, location, project, globalIdentifier });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to get LOC with id (${req.params.id})`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.createLOCHandler = async (req, res) => {
  const gid = req.body.gid ? req.body.gid : null;

  try {
    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(`${EC2_URL}/api/LOCs`, {
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
          error: "Cannot do this operation on the main server; " + data.error,
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
    let order = "";
    if (req.user.role === "super user") {
      loc = await getLOCsForSuperUser(
        { route_id: req.body.route_id, location_id: req.body.location_id },
        req.user,
        order
      );
    } else if (req.user.role === "user") {
      loc = await getLOCsForUser(
        { route_id: req.body.route_id, location_id: req.body.location_id },
        req.user,
        order
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
      response = await fetch(`${EC2_URL}/api/LOCs/${id}`, {
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
          error: "Cannot do this operation on the main server; " + data.error,
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
      let = order = "";
      if (req.user.role === "super admin") {
        locByRouteID = await getLOCsForSuperAdmin(
          { route_id: req.body.route_id, location_id: loc.location_id },
          req.user,
          order
        );
      } else if (req.user.role === "super user") {
        locByRouteID = await getLOCsForSuperUser(
          { route_id: req.body.route_id, location_id: loc.location_id },
          req.user,
          order
        );
      } else if (req.user.role === "user") {
        locByRouteID = await getLOCsForUser(
          { route_id: req.body.route_id, location_id: loc.location_id },
          req.user,
          order
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

    // User can only update the loc status
    if (req.user.role === "user") {
      if (
        (locBody.route_id && locBody.route_id !== loc.route_id) ||
        (locBody.origin && locBody.origin !== loc.origin) ||
        (locBody.field_1 && locBody.field_1 !== loc.field_1) ||
        (locBody.field_2 && locBody.field_2 !== loc.field_2) ||
        (locBody.field_3 && locBody.field_3 !== loc.field_3) ||
        (locBody.MISC && locBody.MISC !== loc.MISC) ||
        (destinationBody.destination &&
          destinationBody.destination !== loc.destination) ||
        (destinationBody.destination_field_1 &&
          destinationBody.destination_field_1 !== loc.destination_field_1) ||
        (destinationBody.destination_field_2 &&
          destinationBody.destination_field_2 !== loc.destination_field_2) ||
        (destinationBody.destination_field_3 &&
          destinationBody.destination_field_3 !== loc.destination_field_3) ||
        (destinationBody.longitude &&
          destinationBody.longitude !== loc.longitude) ||
        (destinationBody.latitude &&
          destinationBody.latitude !== loc.latitude) ||
        (destinationBody.radius && destinationBody.radius !== loc.radius)
      ) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to update LOC ${loc.route_id} (Permission denied)`,
          "PATCH"
        );
        return res.status(403).json({
          error: "Permission denied.",
        });
      }
      // const { error } = validateUpdateLOCForUser(req.body);
      // if (error) {
      //   await log(
      //     req.user.user_id,
      //     req.user.email,
      //     gid,
      //     `Failed to update LOC ${loc.route_id} (Validation error)`,
      //     "PATCH"
      //   );
      //   return res.status(400).json({
      //     error: _.map(error.details, (detail) => _.pick(detail, ["message"])),
      //   });
      // }
    }

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

    if (loc.LOC_type === "dual") {
      let updatedDestination = loc.LOCDestination;
      if (
        Object.values(destinationBody).filter((value) => value !== undefined)
          .length
      ) {
        if (loc.LOCDestination === null) {
          const { error } = validateLOCDestination(destinationBody);
          if (error) {
            await log(
              req.user.user_id,
              req.user.email,
              gid,
              `Failed to update dual LOC ${loc.route_id} (Destination validation error)`,
              "PATCH"
            );
            return res.status(400).json({
              error: _.map(error.details, (detail) =>
                _.pick(detail, ["message"])
              ),
            });
          }
          if (!destinationBody.destination_sync)
            destinationBody.destination_sync = false;
          updatedDestination = await createLOCDestination(destinationBody);
        } else {
          const { error } = validateUpdateLOCDestination(destinationBody);
          if (error) {
            await log(
              req.user.user_id,
              req.user.email,
              gid,
              `Failed to update dual LOC ${loc.route_id} (Destination validation error)`,
              "PATCH"
            );
            return res.status(400).json({
              error: _.map(error.details, (detail) =>
                _.pick(detail, ["message"])
              ),
            });
          }
          if (!destinationBody.destination_sync)
            destinationBody.destination_sync = false;
          updatedDestination = await updateLOCDestination(id, destinationBody);
        }

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
      if (updatedDestination !== null) {
        if (updatedLOC[1]) {
          await log(
            req.user.user_id,
            req.user.email,
            gid,
            `Update dual LOC ${updatedLOC[1][0].dataValues.route_id} (${id})`,
            "PATCH"
          );
          return res.json({
            message: "Dual LOC updated successfully..",
            loc: {
              ...updatedLOC[1][0].dataValues,
              ...updatedDestination.dataValues,
            },
          });
        } else {
          await log(
            req.user.user_id,
            req.user.email,
            gid,
            `Update dual LOC ${loc.route_id} (${id})`,
            "PATCH"
          );
          // loc = _.omit(loc.dataValues, ["LOCDestination", "Location", "User"]);
          return res.json({
            message: "Dual LOC updated successfully..",
            loc: {
              ...loc.dataValues,
              ...updatedDestination.dataValues,
            },
          });
        }
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

exports.validateLOCs = async (data, loggedInUser, location_id) => {
  return new Promise((resolve, reject) => {
    let errors = [];
    const promises = data.map((locData, index) => {
      return new Promise(async (res, rej) => {
        let locError = [];
        const locBody = {
          route_id: locData.route_id,
          origin: locData.origin,
          field_1: locData.field_1,
          field_2: locData.field_2,
          field_3: locData.field_3,
          MISC: locData.MISC,
          LOC_type: locData.LOC_type,
          origin_status: locData.origin_status,
          location_id: location_id,
        };
        // validate the request
        const { error } = validateLOC(locBody);
        if (error) {
          locError.push(
            JSON.stringify(
              _.map(
                error.details,
                (detail) => _.pick(detail, ["message"]).message
              )
            )
          );
        }

        const destinationBody = {
          destination: locData.destination,
          destination_field_1: locData.destination_field_1,
          destination_field_2: locData.destination_field_2,
          destination_field_3: locData.destination_field_3,
          longitude: locData.longitude,
          latitude: locData.latitude,
          radius: locData.radius,
          destination_status: locData.destination_status,
        };

        if (
          locData.LOC_type === "dual" &&
          Object.values(destinationBody).filter((value) => value !== undefined)
            .length
        ) {
          const { error } = validateLOCDestination(destinationBody);
          if (error) {
            locError.push(
              JSON.stringify(
                _.map(
                  error.details,
                  (detail) => _.pick(detail, ["message"]).message
                )
              )
            );
          }
        }

        let loc = [];
        let order = "";
        // if (loggedInUser.role === "admin") {
        //   loc = await getLOCsForAdmin(
        //     {
        //       route_id: locBody.route_id,
        //       location_id,
        //     },
        //     order
        //   );
        // } else
        if (loggedInUser.role === "super admin") {
          loc = await getLOCsForSuperAdmin(
            { route_id: locBody.route_id, location_id },
            loggedInUser,
            order
          );
        } else if (loggedInUser.role === "super user") {
          loc = await getLOCsForSuperUser(
            { route_id: locBody.route_id, location_id },
            loggedInUser,
            order
          );
        } else if (loggedInUser.role === "user") {
          loc = await getLOCsForUser(
            { route_id: locBody.route_id, location_id },
            loggedInUser,
            order
          );
        }

        if (loc.length !== 0) {
          locError.push("This route id already exists!");
        }

        if (locError.length) {
          let obj = {};
          obj[`row${index + 2}`] = locError;
          errors.push(obj);
        }
        res(errors);
      });
    });
    Promise.all(promises).then((outs) => {
      return resolve(outs);
    });
  });
};

exports.uploadFileHandler = async (req, res) => {
  //            ****************Main server*****************
  // if (req.query.mode === "main") {
  //   // convert req.file.buffer to Uint8Array
  //   const ab = new ArrayBuffer(req.file.buffer.length);
  //   const view = new Uint8Array(ab);
  //   for (let i = 0; i < req.file.buffer.length; ++i) {
  //     view[i] = req.file.buffer[i];
  //   }
  //   const formData = new FormData();
  //   formData.append("LocFile", fs.createWriteStream(view));
  //   response = await fetch(
  //     `${process.env.EC2_URL}/api/LOCs/upload/${req.params.id}`,
  //     {
  //       method: "post",
  //       body: formData,
  //       headers: {
  //         Authorization: `Bearer ${req.user.token}`
  //       },
  //     }
  //   );
  //   const data = await response.json();
  //   if (data.error) {
  //     await log(
  //       req.user.user_id,
  //       req.user.email,
  //       null,
  //       `Failed to upload file to main server`,
  //       "POST"
  //     );
  //     return res.status(400).json({
  //       error: "Cannot do this operation on the main server!",
  //       reason: data.error,
  //     });
  //   }
  //   await log(
  //     req.user.user_id,
  //     req.user.email,
  //     null,
  //     `Upload file to main server`,
  //     "POST"
  //   );
  //   return res.json({
  //     message: data.message,
  //   });
  // }

  //            ****************Local server*****************

  if (!req.file) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res.status(400).json({ error: "Please upload one file" });
  }

  const location_id = req.params.id;

  // validate location_id [foreign key]
  if (!uuid.validate(location_id)) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res
      .status(400)
      .json({ error: "Location with given id doesn't exist!" });
  }
  const location = await getLocationWithUser(location_id);
  const project = await getProjectWithUser(location.project_id);
  const globalIdentifier = await getGlobalIdentifierWithUser(project.gid);
  if (!location) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res
      .status(400)
      .json({ error: "Location with given id doesn't exist!" });
  }
  let hasAccess = false;
  if (req.user.role === "saas admin") {
    hasAccess = true;
  } else if (req.user.role === "super admin") {
    hasAccess = location.Project.GlobalIdentifier.org_id === req.user.org_id;
  } else if (req.user.role === "super user") {
    hasAccess =
      location.Project.GlobalIdentifier.user_id === req.user.user_id ||
      (location.Project.GlobalIdentifier.User.org_id === req.user.org_id &&
        location.Project.GlobalIdentifier.privacy === "public") ||
      (await findUserAssignedToGlobalIdentifier({
        gid: location.Project.gid,
        user_id: req.user.user_id,
      }));
  } else {
    hasAccess = false;
  }

  if (!hasAccess) {
    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res
      .status(400)
      .json({ error: "Location with given id doesn't exist!" });
  }

  // convert req.file.buffer to Uint8Array
  const ab = new ArrayBuffer(req.file.buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < req.file.buffer.length; ++i) {
    view[i] = req.file.buffer[i];
  }

  const wb = xlsx.readFile(ab);
  const ws = wb.Sheets["LOC_data"];
  if (!ws) {
    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res.status(400).json({ error: "Sheet LOC_data doesn't exist!" });
  }

  const data = xlsx.utils.sheet_to_json(ws);
  if (!data.length) {
    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res.status(400).json({ error: "Sheet LOC_data is empty!" });
  }

  const errors = await this.validateLOCs(data, req.user, location_id);
  if (errors[0] && errors[0].length) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    return res.status(400).json(errors[0]);
  }
  try {
    data.map(async (locData) => {
      const locBody = {
        route_id: locData.route_id,
        origin: locData.origin,
        field_1: locData.field_1,
        field_2: locData.field_2,
        field_3: locData.field_3,
        MISC: locData.MISC,
        LOC_type: locData.LOC_type,
        origin_status: req.body.origin_status,
        location_id: location_id,
      };
      const newLOC = await createLOC(locBody, req.user.user_id);
      const destinationBody = {
        destination: locData.destination,
        destination_field_1: locData.destination_field_1,
        destination_field_2: locData.destination_field_2,
        destination_field_3: locData.destination_field_3,
        longitude: locData.longitude,
        latitude: locData.latitude,
        radius: locData.radius,
        destination_status: locData.destination_status,
      };
      if (
        locData.LOC_type === "dual" &&
        Object.values(destinationBody).filter((value) => value !== undefined)
          .length
      ) {
        await createLOCDestination(destinationBody, newLOC.loc_id);
      }
    });
    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      "Insert LOCs from file to database",
      "POST"
    );
    res.json({ message: "Data inserted successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      "Failed to Insert LOCs from file to database",
      "POST"
    );
    res.status(500).json({ error: e.message });
  }
};
