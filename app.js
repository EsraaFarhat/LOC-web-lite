const cors = require("cors");
const express = require("express");
require("dotenv").config();

require("./models/user")
require("./models/globalidentifier")
require("./models/project")
require("./models/location")
require("./models/LOC")
require("./models/LOC_destination")
require("./models/log")
require("./models/user_log_gid")

const app = express();

app.use(express.json());
app.use(cors());


process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
    process.exit(1);
  })
  .on("uncaughtException", (err) => {
    console.error(err.message, "Uncaught Exception thrown");
    process.exit(1);
  });

// if (!process.env.PRIVATE_KEY) {
//   throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
// }

module.exports = app;
