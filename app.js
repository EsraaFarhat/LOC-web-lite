const cors = require("cors");
const express = require("express");
const http = require("http");
const os = require("os-utils");
const checkDiskSpace = require("check-disk-space").default;
require("dotenv").config();

const authRouter = require("./routes/auth");
const globalIdentifierRouter = require("./routes/globalIdentifier");
const projectRouter = require("./routes/project");
const LOCRouter = require("./routes/LOC");
const auth = require("./middleware/auth");
const error = require("./middleware/error");

require("./models/user");
require("./models/globalidentifier");
require("./models/project");
require("./models/location");
require("./models/LOC");
require("./models/LOC_destination");

const app = express();

let connected_users = {};
let Max_Connections;

const server = http.createServer(app);

server.on("connection", function (socket) {
  socket.setMaxListeners(100);
  Max_Connections = socket.getMaxListeners();
  socket.__fd = socket.fd;
  connected_users[socket.__fd] = socket.remoteAddress;

  socket.on("close", function () {
    delete connected_users[socket.__fd];
    // console.log(connected_users);
    //     console.log(Object.keys(connected_users).length)
  });
});

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/globalIdentifiers", globalIdentifierRouter);
app.use("/api/projects", projectRouter);
app.use("/api/LOCs", LOCRouter);

app.get("/api/localServerMetrics", auth, async (req, res) => {
  const diskSpace = await checkDiskSpace("/");
  const freeStorage = diskSpace.free / Math.pow(1000, 3);
  const totalStorage = diskSpace.size / Math.pow(1000, 3);

  os.cpuUsage(function (v) {
    return res.json({
      Total_Storage: totalStorage + " GB",
      Free_Storage: freeStorage + " GB",
      CPU_Usage: v * 100 + " %",
      Total_Memory: os.totalmem() + " MB",
      Free_Memory: os.freemem() + " MB",
      Connections: 1,
      Max_Connections,
    });
  });
});

app.use(error);

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
    // process.exit(1);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
  });

if (!process.env.PRIVATE_KEY) {
  throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
}

module.exports = server;
