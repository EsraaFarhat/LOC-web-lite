const axios = require("axios");
const uuid = require("uuid");
const {
  findGlobalIdentifierById,
  createGlobalIdentifier,
  updateGlobalIdentifier,
} = require("../services/globalIdentifier.service");
const {
  createLOC,
  findLOCById,
  getLOC,
  updateLOC,
  createLOCDestination,
  updateLOCDestination,
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

const { log } = require("./log.controller");

exports.downloadLocationHandler = async (req, res) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.fullName,
        null,
        `Failed to download Location with id (${req.params.id})`,
        "GET",
        "error",
        400
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;

    const response = await axios.get(
      `${process.env.EC2_URL}/api/locations/${id}/download`,
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYThjZGEyZWYtMDgwOC00NzcxLThkYWItOGRjNDY3MzZlYTVmIiwiaWF0IjoxNjQ1NDIyNzQ2fQ.UnWJAoisuaGk1ROB8dhGQjmIAIrETxEGT_3oVf4AddI`,
        },
      }
    );

    if (!response.data.location) {
      return res.status(404).json({ error: "Location doesn't exist" });
    }

    if (response.data.globalIdentifier.sync === true) {
      let globalIdentifier = await findGlobalIdentifierById(
        response.data.globalIdentifier.gid
      );
      if (!globalIdentifier) {
        await createGlobalIdentifier(response.data.globalIdentifier);
        console.log("global identifier created");
      } else {
        await updateGlobalIdentifier(
          globalIdentifier.gid,
          response.data.globalIdentifier
        );
        console.log("global identifier updated");
      }
    }
    if (response.data.project.sync === true) {
      let project = await findProjectById(response.data.project.id);
      if (!project) {
        await createProject(response.data.project);
        console.log("project created");
      } else {
        await updateProject(project.id, response.data.project);
        console.log("project updated");
      }
    }
    if (response.data.location.sync === true) {
      let location = await findLocationById(response.data.location.id);
      if (!location) {
        await createLocation(response.data.location);
        console.log("location created");
      } else {
        await updateLocation(location.id, response.data.location);
        console.log("location updated");
      }
    }
    response.data.singleLOCs.forEach(async (loc) => {
      if (loc.sync === true) {
        let local_loc = await findLOCById(loc.loc_id);
        if (!local_loc) {
          await createLOC(loc);
          console.log("single loc created");
        } else {
          loc.user_id = local_loc.user_id;
          await updateLOC(local_loc.loc_id, loc);
          console.log("single loc updated");
        }
      }
    });
    response.data.dualLOCs.forEach(async (loc) => {
      let local_loc = await getLOC(loc.loc_id);
      if (loc.sync === true) {
        if (!local_loc) {
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
            },
            req.user.user_id
          );
          console.log("dual loc created");
        } else {
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
          });
          console.log("dual loc updated");
        }
      }
      if (loc.LOCDestination.sync === true) {
        let local_loc_destination = local_loc.LOCDestination;
        if (!local_loc_destination) {
          await createLOCDestination(
            {
              destination_id: loc.LOCDestination.destination_id,
              destination: loc.LOCDestination.destination,
              destination_field_1: loc.LOCDestination.destination_field_1,
              destination_field_2: loc.LOCDestination.destination_field_2,
              destination_field_3: loc.LOCDestination.destination_field_3,
              createdAt: loc.LOCDestination.createdAt,
              updatedAt: loc.LOCDestination.updatedAt,
            },
            loc.LOCDestination.loc_id
          );
          console.log("destination created");
        } else {
          let dest = await updateLOCDestination(loc.LOCDestination.loc_id, {
            destination_id: loc.LOCDestination.destination_id,
            destination: loc.LOCDestination.destination,
            destination_field_1: loc.LOCDestination.destination_field_1,
            destination_field_2: loc.LOCDestination.destination_field_2,
            destination_field_3: loc.LOCDestination.destination_field_3,
            createdAt: loc.LOCDestination.createdAt,
            updatedAt: loc.LOCDestination.updatedAt,
          });
          console.log("destination updated");
        }
      }
    });

    res.json({ message: "Downloaded Successfully.." });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to download location for web lite`,
      "DELETE",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
