const cors = require("cors");
const express = require("express");
const http = require("http");
const os = require("os-utils");
const socketio = require("socket.io");
const net = require("net");
const checkDiskSpace = require("check-disk-space").default;
require("dotenv").config();

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const globalIdentifierRouter = require("./routes/globalIdentifier");
const projectRouter = require("./routes/project");
const LocationRouter = require("./routes/location");
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
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

let connected_users = {};
let Max_Connections = 5;
let count = 0;

io.on("connection", (socket) => {
  if (io.engine.clientsCount > Max_Connections) {
    socket.emit("err", { message: "Reach the limit of connections" });
    socket.disconnect();
    console.log("Disconnected...");
    return;
  }

  console.log("New websocket connection");
  count++;
  console.log(count);

  socket.on("disconnect", () => {
    console.log("User left");
    count--;
    console.log(count);
  });
});

app.use(express.json());
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/globalIdentifiers", globalIdentifierRouter);
app.use("/api/projects", projectRouter);
app.use("/api/locations", LocationRouter);
app.use("/api/LOCs", LOCRouter);

app.get("/localServerMetrics", auth, async (req, res) => {
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
      Connections: count,
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

// if (!process.env.PRIVATE_KEY) {
//   throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
// }

module.exports = server;
