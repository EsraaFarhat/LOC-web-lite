const axios = require("axios");
const uuid = require("uuid");

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

    res.json({ message: "Downloaded Successfully..", data: response.data });
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
