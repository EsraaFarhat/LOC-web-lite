 const { InfluxDB, FieldType } = require("influx");

const influxDB_name = process.env.INFLUXDB_NAME;
const influxDB_username = process.env.INFLUXDB_USERNAME;
const influxDB_password = process.env.INFLUXDB_PASSWORD;
const influxDB_host = process.env.INFLUXDB_HOST;

const influx = new InfluxDB({
    host: influxDB_host,
    username: influxDB_username,
    password: influxDB_password,
    database: influxDB_name,
    schema: [
      {
        measurement: "logs",
        fields: {
          description: FieldType.STRING,
          state: FieldType.BOOLEAN, //* true => seen, false => unseen
          user_name: FieldType.STRING,
        },
        tags: ["user_id", "gid", "method"],
      },
    ],
});

influx
.getDatabaseNames()
.then((names) => {
  if (!names.includes(influxDB_name)) {
    return influx.createDatabase(influxDB_name);
  }
})
.then(() => {
  console.log("Connected to the influx database successfully...");
})
.catch((error) => {
  throw new Error("Unable to connect to influx database: " + error);
});

module.exports = influx;
