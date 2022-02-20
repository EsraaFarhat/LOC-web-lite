const influx = require("../db/Influxdb/influxdb");

exports.log = async (
  user_id,
  user_name,
  gid,
  description,
  method,
  level,
  status_code,
  state = false
) => {
  try {
    await influx.writePoints([
      {
        measurement: "logs",
        fields: {
          user_name,
          description,
          level,
          status_code,
          state, //* true => seen, false => unseen
        },
        tags: {
          user_id,
          gid,
          method,
        },
        timestamp: Date.now() * 1000000,
      },
    ]);
  } catch (e) {
    throw new Error(e);
  }
};

// exports.updateLogHandler = async (req, res) => {
//   try {
//     let time = req.params.time;
//     time = Date.parse(time) * 1000000;

//     const log = await influx.query(`SELECT * FROM logs WHERE time = ${time}`);
//     if (!log.length) {
//       await this.log(
//         req.user.user_id,
//         req.user.fullName,
//         null,
//         `Failed to update log (doesn't exist)`,
//         "PATCH",
//         "error",
//         404
//       );
//       return res.status(404).json({ error: "Log doesn't exist!" });
//     }
//     await influx.writePoints([
//       {
//         measurement: "logs",
//         fields: {
//           user_name: log[0].user_name,
//           description: log[0].description,
//           level: log[0].level,
//           status_code: log[0].status_code,
//           state: true,
//         },
//         tags: {
//           user_id: log[0].user_id,
//           gid: log[0].gid,
//           method: log[0].method,
//         },
//         timestamp: log[0].time,
//       },
//     ]);

//     await this.log(
//       req.user.user_id,
//       req.user.fullName,
//       null,
//       `UPdate log)`,
//       "PATCH",
//       "success",
//       200
//     );

//     res.json({ message: "Log updated successfully.." });
//   } catch (e) {
//     await this.log(
//       req.user.user_id,
//       req.user.fullName,
//       null,
//       `Failed to update log`,
//       "PATCH",
//       "error",
//       500
//     );
//     res.status(500).json({ error: e.message });
//   }
// };
