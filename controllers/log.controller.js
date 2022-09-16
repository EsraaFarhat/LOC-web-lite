// const influx = require("../db/Influxdb/influxdb");

exports.log = async (
  user_id,
  user_name,
  gid,
  description,
  method,
  state = false
) => {
  try {
    // await influx.writePoints([
    //   {
    //     measurement: "logs",
    //     fields: {
    //       user_name,
    //       description,
    //       state, //* true => seen, false => unseen
    //     },
    //     tags: {
    //       user_id,
    //       gid,
    //       method,
    //     },
    //     timestamp: Date.now() * 1000000,
    //   },
    // ]);
  } catch (e) {
    throw new Error(e);
  }
};
