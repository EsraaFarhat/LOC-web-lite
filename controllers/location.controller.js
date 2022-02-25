const uuid = require("uuid");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
} = require("../services/location.service");
const {
  findProjectById,
  createProject,
  updateProject,
} = require("../services/project.service");
const { UserLoginToMainServerHandler } = require("../services/user.service");

const { log } = require("./log.controller");

exports.downloadLocationHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to download Location with id (${req.params.id})`,
        "POST",
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;

    response = await fetch(
      `${process.env.EC2_URL}/api/locations/${id}/download`,
      {
        headers: {
          Authorization: `Bearer ${req.user.token}`,
        },
      }
    );
    const data = await response.json();
    if (data.error) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to download Location with id (${req.params.id})`,
        "POST",
      );
      return res
        .status(500)
        .json({ message: "Error from the main server", error: data.error });
    }

    let errors = [];

    let globalIdentifier = await findGlobalIdentifierById(
      data.globalIdentifier.gid
    );
    // data.globalIdentifier.sync = true;
    if (!globalIdentifier) {
      try {
        let globalIdentifier = await findGlobalIdentifier(
          data.globalIdentifier.name
        );
        if (globalIdentifier)
          await deleteGlobalIdentifier(globalIdentifier.gid);
        await createGlobalIdentifier(data.globalIdentifier);
        console.log("global identifier created");
      } catch (e) {
        throw new Error(
          `Couldn't create global identifier ${globalIdentifier.gid}: ${e.message}`
        );
      }
    } else {
      try {
        let globalIdentifier2 = await findGlobalIdentifier(
          data.globalIdentifier.name
        );
        if (globalIdentifier2 && globalIdentifier2.gid !== globalIdentifier.gid)
          await deleteGlobalIdentifier(globalIdentifier2.gid);
        await updateGlobalIdentifier(
          globalIdentifier.gid,
          data.globalIdentifier
        );
        console.log("global identifier updated");
      } catch (e) {
        errors.push(
          `Couldn't update global identifier ${globalIdentifier.gid}: ${e.message}`
        );
      }
    }
    let project = await findProjectById(data.project.id);
    if (!project) {
      try {
        await createProject(data.project);
        console.log("project created");
      } catch (e) {
        throw new Error(`Couldn't create project ${project.id}: ${e.message}`);
      }
    } else {
      try {
        await updateProject(project.id, data.project);
        console.log("project updated");
      } catch (e) {
        errors.push(`Couldn't update project ${project.id}: ${e.message}`);
      }
    }
    let location = await findLocationById(data.location.id);
    if (!location) {
      try {
        await createLocation(data.location);
        console.log("location created");
      } catch (e) {
        throw new Error(
          `Couldn't create location ${location.id}: ${e.message}`
        );
      }
    } else {
      try {
        await updateLocation(location.id, data.location);
        console.log("location updated");
      } catch (e) {
        errors.push(`Couldn't update location ${location.id}: ${e.message}`);
      }
    }
    data.singleLOCs.forEach(async (loc) => {
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

    if (errors.length !== 0){
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Download Location with id (${req.params.id}) completed with errors`,
        "POST",
      );
      return res.json({ message: "Download completed with errors", errors });
    }

    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Download Location with id (${req.params.id}) completed`,
      "POST",
    );
    res.json({ message: "Download completed.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to download location for web lite`,
      "DELETE",
    );
    res.status(500).json({ error: e.message });
  }
};

exports.uploadLOCs = async (data) => {
  return new Promise((resolve, reject) => {
    let errors = [];
    const promises = data.map((local_loc, index) => {
      return new Promise(async (res, rej) => {
        let err;
        if (local_loc.sync === false) {
          let loc = await fetch(
            `${process.env.EC2_URL}/api/LOCs/${local_loc.loc_id}`,
            {
              headers: {
                Authorization: `Bearer ${req.user.token}`,
              },
            }
          );
          loc = await loc.json();

          if (loc.error === "LOC doesn't exist!") {
            let response = await fetch(
              `${process.env.EC2_URL}/api/LOCs/upload`,
              {
                method: "post",
                body: JSON.stringify(local_loc.dataValues),
                headers: {
                  Authorization: `Bearer ${req.user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            response = await response.json();
            if (response.error) {
              err = {
                error: `Couldn't upload loc ${local_loc.loc_id}`,
                reason: response.error,
              };
            } else {
              await updateLOC(local_loc.loc_id, { sync: true });
              console.log("loc created");
            }
          } else if (loc.error) {
            err = {
              error: `Couldn't upload loc ${local_loc.loc_id}`,
              reason: loc.error,
            };
          } else {
            let response = await fetch(
              `${process.env.EC2_URL}/api/LOCs/${local_loc.loc_id}/upload`,
              {
                method: "patch",
                body: JSON.stringify(local_loc.dataValues),
                headers: {
                  Authorization: `Bearer ${req.user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            response = await response.json();
            if (response.error) {
              err = {
                error: `Couldn't upload loc ${local_loc.loc_id}`,
                reason: response.error,
              };
            } else {
              console.log("loc updated");
              await updateLOC(local_loc.loc_id, { sync: true });
            }
          }
        }

        if (err) {
          errors.push(err);
        }
        res(errors);
      });
    });
    Promise.all(promises).then((outs) => {
      return resolve(outs);
    });
  });
};

exports.uploadLocationHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to upload Location with id (${req.params.id})`,
        "POST",
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;

    const location = await findLocationById(id);
    if (!location) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to upload Location with id (${req.params.id})`,
        "POST",
      );
      return res.status(404).json({ error: "Location doesn't exist" });
    }

    const LOCs = await getLOCsByLocationId(id);

    const errors = await this.uploadLOCs(LOCs);

    if (errors[0].length) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Upload Location with id (${req.params.id}) completed with errors`,
        "POST",
      );
      return res
        .status(400)
        .json({ message: "Upload completed with errors", error: errors[0] });
    }

    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Upload Location with id (${req.params.id}) completed`,
      "POST",
    );
    res.json({ message: "Upload completed successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to upload location for web lite`,
      "POST",
    );
    res.status(500).json({ error: e.message });
  }
};
