const uuid = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const _ = require("lodash");

const {
  findGlobalIdentifierById,
  createGlobalIdentifier,
  updateGlobalIdentifier,
  findGlobalIdentifier,
  deleteGlobalIdentifier,
} = require("../services/globalIdentifier.service");
const {
  createLOC,
  findLOCById,
  getLOC,
  updateLOC,
  createLOCDestination,
  updateLOCDestination,
  getLOCsByLocationId,
  findLOCByRouteId,
  deleteLOC,
} = require("../services/LOC.service");
const {
  findLocationById,
  createLocation,
  updateLocation,
  findLocation,
  deleteLocation,
} = require("../services/location.service");
const {
  findProjectById,
  createProject,
  updateProject,
  findProject,
  deleteProject,
} = require("../services/project.service");
const { UserLoginToMainServerHandler } = require("../services/user.service");

const { log } = require("./log.controller");
const { EC2_URL } = require("../EC2_url");

exports.getLocationHandler = async (req, res) => {
  try {
    //            ****************Main server*****************
    if (req.query.mode === "main") {
      response = await fetch(`${EC2_URL}/api/locations/${req.params.id}`, {
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
          `Failed to fetch location with id ${req.params.id} from main server`,
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
        `Get location with id ${req.params.id} from main server`,
        "GET"
      );
      return res.json({
        location: data.location,
        project: data.project,
        globalIdentifier: data.globalIdentifier,
      });
    }

    //            ****************Local server*****************
    const id = req.params.id;
    let location = req.locationToGet;
    let project = await findProjectById(location.project_id);
    let globalIdentifier = _.pick(project, [
      "GlobalIdentifier.gid",
      "GlobalIdentifier.name",
      "GlobalIdentifier.privacy",
    ]).GlobalIdentifier;
    project = _.pick(project, ["id", "name"]);

    location = _.pick(location, [
      "id",
      "name",
      "longitude",
      "latitude",
      "radius",
      "createdAt",
      "updatedAt",
      "project_id",
      "User.user_id",
    ]);
    await log(
      req.user.user_id,
      req.user.email,
      globalIdentifier.gid,
      `Fetch location (${id})`,
      "GET"
    );

    res.json({ location, project, globalIdentifier });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to Fetch Location with id (${req.params.id})`,
      "GET"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.downloadLocationHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to download Location with id (${req.params.id})`,
        "POST"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;

    response = await fetch(`${EC2_URL}/api/locations/${id}/download`, {
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
        `Failed to download Location with id (${req.params.id})`,
        "POST"
      );
      return res
        .status(500)
        .json({ message: "Error from the main server", error: data.error });
    }

    if (data.globalIdentifier.User.role === "saas admin")
      data.globalIdentifier.user_id = null;
    if (data.project.User.role === "saas admin") data.project.user_id = null;
    if (data.location.User.role === "saas admin") data.location.user_id = null;

    let errors = [];

    let globalIdentifier = await findGlobalIdentifierById(
      data.globalIdentifier.gid
    );
    // data.globalIdentifier.sync = true;
    if (!globalIdentifier) {
      // try {
      let globalIdentifier = await findGlobalIdentifier(
        data.globalIdentifier.name
      );
      if (globalIdentifier) await deleteGlobalIdentifier(globalIdentifier.gid);

      await createGlobalIdentifier(data.globalIdentifier);
      console.log("global identifier created");
      // } catch (e) {
      //   throw new Error(
      //     `Couldn't create global identifier ${globalIdentifier.gid}: ${e.message}`
      //   );
      // }
    } else {
      // try {
      let globalIdentifier2 = await findGlobalIdentifier(
        data.globalIdentifier.name
      );
      if (globalIdentifier2 && globalIdentifier2.gid !== globalIdentifier.gid)
        await deleteGlobalIdentifier(globalIdentifier2.gid);

      await updateGlobalIdentifier(globalIdentifier.gid, data.globalIdentifier);
      console.log("global identifier updated");
      // } catch (e) {
      //   errors.push(
      //     `Couldn't update global identifier ${globalIdentifier.gid}: ${e.message}`
      //   );
      // }
    }
    let project = await findProjectById(data.project.id);
    if (!project) {
      // try {
      let project = await findProject({ name: data.project.name });
      if (project) await deleteProject(project.id);
      await createProject(data.project);
      console.log("project created");
      // } catch (e) {
      //   throw new Error(`Couldn't create project ${project.id}: ${e.message}`);
      // }
    } else {
      // try {
      let project2 = await findProject({ name: data.project.name });
      if (project2 && project2.id !== project.id)
        await deleteProject(project2.id);
      await updateProject(project.id, data.project);
      console.log("project updated");
      // } catch (e) {
      //   errors.push(`Couldn't update project ${project.id}: ${e.message}`);
      // }
    }
    let location = await findLocationById(data.location.id);
    if (!location) {
      // try {
      let location = await findLocation({ name: data.location.name });
      if (location) await deleteLocation(location.id);
      await createLocation(data.location);
      console.log("location created");
      // } catch (e) {
      //   console.log(e);
      //   throw new Error(
      //     `Couldn't create location ${location.id}: ${e.message}`
      //   );
      // }
    } else {
      // try {
      let location2 = await findLocation({ name: data.project.name });
      if (location2 && location2.id !== location.id)
        await deleteLocation(location.id);
      await updateLocation(location.id, data.location);
      console.log("location updated");
      // } catch (e) {
      //   errors.push(`Couldn't update location ${location.id}: ${e.message}`);
      // }
    }
    data.singleLOCs.forEach(async (loc) => {
      if (loc.User.role === "saas admin") loc.user_id = null;

      let local_loc = await findLOCById(loc.loc_id);
      loc.sync = true;
      if (!local_loc) {
        try {
          let loc_with_routeID = await findLOCByRouteId(loc.route_id);
          if (loc_with_routeID) await deleteLOC(loc_with_routeID.loc_id);
          await createLOC(loc, req.user.user_id);
          console.log("single loc created");
        } catch (e) {
          errors.push(`Couldn't create loc ${loc.loc_id}: ${e.message}`);
        }
      } else {
        try {
          let loc_with_routeID = await findLOCByRouteId(loc.route_id);
          if (loc_with_routeID && loc_with_routeID.loc_id !== local_loc.loc_id)
            await deleteLOC(loc_with_routeID.loc_id);
          loc.user_id = local_loc.user_id;
          await updateLOC(local_loc.loc_id, loc);
          console.log("single loc updated");
        } catch (e) {
          errors.push(`Couldn't update loc ${loc.loc_id}: ${e.message}`);
        }
      }
    });
    data.dualLOCs.forEach(async (loc) => {
      if (loc.User.role === "saas admin") loc.user_id = null;

      let local_loc = await getLOC(loc.loc_id);
      if (!local_loc) {
        try {
          let loc_with_routeID = await findLOCByRouteId(loc.route_id);
          if (loc_with_routeID) await deleteLOC(loc_with_routeID.loc_id);
          local_loc = await createLOC(
            {
              loc_id: loc.loc_id,
              route_id: loc.route_id,
              origin_id: loc.origin_id,
              origin: loc.origin,
              field_1: loc.field_1,
              field_2: loc.field_2,
              field_3: loc.field_3,
              MISC: loc.MISC,
              cable_status: loc.cable_status,
              LOC_type: loc.LOC_type,
              createdAt: loc.createdAt,
              updatedAt: loc.updatedAt,
              location_id: loc.location_id,
              sync: true,
            },
            req.user.user_id
          );
          console.log("dual loc created");
        } catch (e) {
          errors.push(`Couldn't create loc ${loc.loc_id}: ${e.message}`);
        }
      } else {
        try {
          let loc_with_routeID = await findLOCByRouteId(loc.route_id);
          if (loc_with_routeID && loc_with_routeID.loc_id !== local_loc.loc_id)
            await deleteLOC(loc_with_routeID.loc_id);
          loc.user_id = local_loc.user_id;
          await updateLOC(local_loc.loc_id, {
            loc_id: loc.loc_id,
            route_id: loc.route_id,
            origin_id: loc.origin_id,
            origin: loc.origin,
            field_1: loc.field_1,
            field_2: loc.field_2,
            field_3: loc.field_3,
            MISC: loc.MISC,
            cable_status: loc.cable_status,
            LOC_type: loc.LOC_type,
            createdAt: loc.createdAt,
            updatedAt: loc.updatedAt,
            location_id: loc.location_id,
            sync: true,
          });
          console.log("dual loc updated");
        } catch (e) {
          errors.push(`Couldn't update loc ${loc.loc_id}: ${e.message}`);
        }
      }
      if (loc.LOCDestination) {
        let local_loc_destination = local_loc.LOCDestination;
        if (!local_loc_destination) {
          try {
            await createLOCDestination(
              {
                destination_id: loc.LOCDestination.destination_id,
                destination: loc.LOCDestination.destination,
                destination_field_1: loc.LOCDestination.destination_field_1,
                destination_field_2: loc.LOCDestination.destination_field_2,
                destination_field_3: loc.LOCDestination.destination_field_3,
                createdAt: loc.LOCDestination.createdAt,
                updatedAt: loc.LOCDestination.updatedAt,
                destination_sync: true,
              },
              loc.LOCDestination.loc_id
            );
            console.log("destination created");
          } catch (e) {
            errors.push(
              `Couldn't create destination for loc ${loc.loc_id}: ${e.message}`
            );
          }
        } else {
          try {
            await updateLOCDestination(loc.LOCDestination.loc_id, {
              destination_id: loc.LOCDestination.destination_id,
              destination: loc.LOCDestination.destination,
              destination_field_1: loc.LOCDestination.destination_field_1,
              destination_field_2: loc.LOCDestination.destination_field_2,
              destination_field_3: loc.LOCDestination.destination_field_3,
              createdAt: loc.LOCDestination.createdAt,
              updatedAt: loc.LOCDestination.updatedAt,
              destination_sync: true,
            });
            console.log("destination updated");
          } catch (e) {
            errors.push(
              `Couldn't update destination for loc ${loc.loc_id}: ${e.message}`
            );
          }
        }
      }
    });

    if (errors.length !== 0) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Download Location with id (${req.params.id}) completed with errors`,
        "POST"
      );
      return res.json({ message: "Download completed with errors", errors });
    }

    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Download Location with id (${req.params.id}) completed`,
      "POST"
    );
    res.json({ message: "Download completed.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to download location for web lite`,
      "DELETE"
    );
    res.status(500).json({ error: e.message });
  }
};

exports.syncLOCs = async (data, token) => {
  return new Promise((resolve, reject) => {
    let error = {};
    const promises = data.map((local_loc, index) => {
      return new Promise(async (res, rej) => {
        let err;
        try {
          await updateLOC(local_loc.loc_id, { sync: true });
        } catch (e) {
          // errors.push(e.message);
          error = e.message;
        }

        // if (local_loc.sync === false) {
        //   let loc = await fetch(
        //     `${process.env.EC2_URL}/api/LOCs/${local_loc.loc_id}`,
        //     {
        //       headers: {
        //         Authorization: `Bearer ${token}`,
        //       },
        //     }
        //   );
        //   loc = await loc.json();
        //   if (loc.error === "LOC doesn't exist!") {
        //     // local_loc.dataValues
        //     let response = await fetch(
        //       `${process.env.EC2_URL}/api/LOCs/uploadFromLite`,
        //       {
        //         method: "post",
        //         body: JSON.stringify(local_loc.dataValues),
        //         headers: {
        //           Authorization: `Bearer ${token}`,
        //           "Content-Type": "application/json",
        //         },
        //       }
        //     );
        //     response = await response.json();
        //     if (response.error) {
        //       err = {
        //         error: `Couldn't upload loc ${local_loc.loc_id}`,
        //         reason: response.error,
        //       };
        //       await updateLOC(local_loc.loc_id, { sync: true });
        //     } else {
        //       await updateLOC(local_loc.loc_id, { sync: true });
        //       console.log("loc created");
        //     }
        //   } else if (loc.error) {
        //     err = {
        //       error: `Couldn't upload loc ${local_loc.loc_id}`,
        //       reason: loc.error,
        //     };
        //   } else {
        //     let response = await fetch(
        //       `${process.env.EC2_URL}/api/LOCs/${local_loc.loc_id}/uploadFromLite`,
        //       {
        //         method: "patch",
        //         body: JSON.stringify(local_loc.dataValues),
        //         headers: {
        //           Authorization: `Bearer ${token}`,
        //           "Content-Type": "application/json",
        //         },
        //       }
        //     );
        //     response = await response.json();
        //     if (response.error) {
        //       err = {
        //         error: `Couldn't upload loc ${local_loc.loc_id}`,
        //         reason: response.error,
        //       };
        //       await updateLOC(local_loc.loc_id, { sync: true });
        //     } else {
        //       console.log("loc updated");
        //       await updateLOC(local_loc.loc_id, { sync: true });
        //     }
        //   }
        // }

        // if (err) {
        //   errors.push(err);
        // }
        res();
      });
    });
    Promise.all(promises).then(() => {
      return resolve({ data, error });
    });
  });
};

exports.uploadLocationHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to upload Location with id (${req.params.id})`,
        "POST"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;

    const location = await findLocationById(id);
    if (!location) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to upload Location with id (${req.params.id})`,
        "POST"
      );
      return res.status(404).json({ error: "Location doesn't exist" });
    }

    let order = "";
    let LOCs = await getLOCsByLocationId(id, req.user, order);

    LOCs = _.map(LOCs, (loc) => _.omit(loc.dataValues, ["Location", "User"]));

    let response = await fetch(`${EC2_URL}/api/LOCs/sync-locs`, {
      method: "post",
      body: JSON.stringify(LOCs),
      headers: {
        Authorization: `Bearer ${req.user.token}`,
        "Content-Type": "application/json",
      },
    });
    response = await response.json();

    if (response.error) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to upload Location with id (${req.params.id})`,
        "POST"
      );
      return res
        .status(400)
        .json({ error: `Couldn't upload locs; ` + response.error });
    } else {
      const { error } = await this.syncLOCs(LOCs, req.user.token);

      if (Object.keys(error).length) {
        await log(
          req.user.user_id,
          req.user.email,
          null,
          `Upload Location with id (${req.params.id}) completed with errors`,
          "POST"
        );
        return res
          .status(400)
          .json({ message: "Upload completed with errors", error });
      }

      // await updateLOC(local_loc.loc_id, { sync: true });
      // await updateLOC(local_loc.loc_id, { sync: true });
      // console.log("loc created");
    }

    // if (errors[0].length) {
    //   await log(
    //     req.user.user_id,
    //     req.user.email,
    //     null,
    //     `Upload Location with id (${req.params.id}) completed with errors`,
    //     "POST"
    //   );
    //   return res
    //     .status(400)
    //     .json({ message: "Upload completed with errors", error: errors[0] });
    // }

    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Upload Location with id (${req.params.id}) completed`,
      "POST"
    );
    res.json({ message: "Upload completed successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to upload location for web lite`,
      "POST"
    );
    res.status(500).json({ error: e.message });
  }
};
