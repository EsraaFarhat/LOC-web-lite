const uuid = require("uuid");

const { log } = require("../controllers/log.controller");
const {
  findUserAssignedToGlobalIdentifier,
} = require("../services/globalIdentifier.service");
const { getLOCWithUser } = require("../services/LOC.service");
const { getLocationWithUser } = require("../services/location.service");
const { findUser } = require("../services/user.service");

exports.canGetLOC = async (req, res, next) => {
  try {
    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }
    const id = req.params.id;

    const loc = await getLOCWithUser(id);

    if (!loc) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "LOC doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR you are not the user created this LOC
     ** OR this LOC wasn't created by your super user or any user in your company
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = true;
    } else if (req.user.role === "super admin") {
      hasAccess =
        loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id;
    } else if (req.user.role === "super user") {
      hasAccess =
        loc.Location.Project.GlobalIdentifier.user_id === req.user.user_id ||
        (loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: req.user.user_id,
        }));
    } else {
      hasAccess =
        (loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: req.user.user_id,
        }));
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        null,
        `Failed to get LOC with id (${req.params.id})`,
        "GET"
      );
      return res.status(404).json({ error: "LOC doesn't exist!" });
    }
    req.locToGet = loc;
    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to get LOC with id (${req.params.id})`,
      "GET"
    );
    return res.status(500).json({ error: e.message });
  }
};

exports.canGetLocationForCreateLOC = async (req, res, next) => {
  if (req.query.mode === "main") {
    return next();
  }
  const gid = req.body.gid ? req.body.gid : null;
  try {
    if (!uuid.validate(req.body.location_id)) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to create loc in this location`,
        "POST"
      );
      return res
        .status(400)
        .json({ error: "Cannot create loc in this location!" });
    }
    const id = req.body.location_id;

    const location = await getLocationWithUser(id);
    if (!location) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to create loc in this location`,
        "POST"
      );
      return res
        .status(400)
        .json({ error: "Cannot create loc in this location!" });
    }

    /*
     ** If you are not an admin
     ** OR you are not the user created this location
     ** OR this location wasn't created by your super user or any user in your company
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = true;
    } else if (req.user.role === "super admin") {
      hasAccess = location.Project.GlobalIdentifier.org_id === req.user.org_id;
    } else if (req.user.role === "super user") {
      hasAccess =
        location.Project.GlobalIdentifier.user_id === req.user.user_id ||
        (location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: location.Project.gid,
          user_id: req.user.user_id,
        }));
    } else {
      hasAccess =
        (location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: location.Project.gid,
          user_id: req.user.user_id,
        }));
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to create loc in this location`,
        "POST"
      );
      return res
        .status(400)
        .json({ error: "Cannot create loc in this location!" });
    }
    req.locationToGet = location;
    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `Failed to create loc in this location`,
      "POST"
    );
    return res.status(500).json({ error: e.message });
  }
};

exports.canUpdate = async (req, res, next) => {
  const gid = req.body.gid ? req.body.gid : null;
  try {
    if (req.query.mode === "main") {
      return next();
    }

    if (!uuid.validate(req.params.id)) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to update LOC with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(400).json({ error: "Invalid Id!" });
    }

    const id = req.params.id;
    let loc = await getLOCWithUser(id);

    if (!loc) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to update LOC with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(404).json({ error: "LOC doesn't exist!" });
    }
    /*
     ** If you are not an admin
     ** OR you are not the super user to the user created this LOC
     ** OR you are not the user created this LOC
     */
    let hasAccess = false;
    if (req.user.role === "saas admin") {
      hasAccess = true;
    } else if (req.user.role === "super admin") {
      hasAccess =
        loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id;
    } else if (req.user.role === "super user") {
      hasAccess =
        loc.Location.Project.GlobalIdentifier.user_id === req.user.user_id ||
        (loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: req.user.user_id,
        }));
    } else {
      hasAccess =
        (loc.Location.Project.GlobalIdentifier.org_id === req.user.org_id &&
          loc.Location.Project.GlobalIdentifier.privacy === "public") ||
        (await findUserAssignedToGlobalIdentifier({
          gid: loc.Location.Project.gid,
          user_id: req.user.user_id,
        }));
    }

    if (!hasAccess) {
      await log(
        req.user.user_id,
        req.user.email,
        gid,
        `Failed to update LOC with id (${req.params.id})`,
        "PATCH"
      );
      return res.status(400).json({ error: "Cannot update loc!" });
    }
    req.locToUpdate = loc;

    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      gid,
      `Failed to update LOC with id (${req.params.id})`,
      "PATCH"
    );
    return res.status(500).json({ error: e.message });
  }
};

exports.checkForTagsAvailability = async (req, res, next) => {
  const gid = req.body.gid ? req.body.gid : null;

  try {
    if (req.user.role === "saas admin") {
      if (req.user.available_tags - 1 < -1000) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to create LOC ${req.body.route_id} (No tags available)`,
          "POST"
        );

        return res
          .status(400)
          .json({ error: "No tags available. You need to buy more tags." });
      }
    } else if (req.user.role === "super admin") {
      if (req.user.available_tags <= 0) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to create LOC ${req.body.route_id} (No tags available)`,
          "POST"
        );

        return res.status(400).json({
          error:
            "Not tags available. Contact accounts@keltechiot.com for more tags.",
        });
      }
    } else {
      let admin = await findUser({
        org_id: req.user.org_id,
        role: "super admin",
      });
      if (admin.available_tags <= 0) {
        await log(
          req.user.user_id,
          req.user.email,
          gid,
          `Failed to create LOC ${req.body.route_id} (No tags available)`,
          "POST"
        );

        return res.status(400).json({
          error: "Not tags available. Contact you super user for more tags.",
        });
      }

      req.admin = admin;
    }
    next();
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.email,
      null,
      `Failed to create LOC`,
      "POST"
    );
    return res.status(500).json({ error: e.message });
  }
};
