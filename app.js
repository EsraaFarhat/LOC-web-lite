const cors = require("cors");
const express = require("express");
require("dotenv").config();

const db = require('./db');

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
