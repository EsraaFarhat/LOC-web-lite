const axios = require("axios");
const uuid = require("uuid");

const { log } = require("./log.controller");

exports.downloadLocationHandler = async (req, res) => {
  try {
    require("dns").resolve("www.google.com", async function (err) {
      if (err) {
        console.log("No internet connection");
      } else {
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

        axios
          .get(`${process.env.EC2_URL}/api/locations/${id}/download-lite`, {headers: {'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYThjZGEyZWYtMDgwOC00NzcxLThkYWItOGRjNDY3MzZlYTVmIiwiaWF0IjoxNjQ1NDIyNzQ2fQ.UnWJAoisuaGk1ROB8dhGQjmIAIrETxEGT_3oVf4AddI`}})
          .then(function (response) {
            // handle success
            console.log(response);
          })
          .catch(function (error) {
            // handle error
            throw new Error(error);
          });
      }
    });
  } catch (e) {
    await log(
      req.user.user_id,
      req.user.fullName,
      null,
      `Failed to download location for mobile`,
      "DELETE",
      "error",
      500
    );
    res.status(500).json({ error: e.message });
  }
};
