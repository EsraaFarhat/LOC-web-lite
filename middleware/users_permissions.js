const { log } = require("../controllers/log.controller");

exports.isSuperUser = async (req, res, next) => {
  if (req.user.role !== "super user") {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Permission denied`,
      "POST",
    );
    return res.status(403).json({ error: "Permission denied!" });
  }

  next();
};
