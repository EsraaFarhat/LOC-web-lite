const { Sequelize } = require("sequelize");
require("dotenv").config();

const db_name = process.env.DATABASE_NAME;
const db_username = process.env.DATABASE_USERNAME;
const db_password = process.env.DATABASE_PASSWORD;
const db_host = process.env.DATABASE_HOST;
const db_PORT = process.env.DATABASE_PORT;
const db_dialect = process.env.DATABASE_DIALECT;
const sequelize = new Sequelize(db_name, db_username, db_password, {
  host: db_host,
  port: db_PORT,
  dialect: db_dialect,
  dialectOptions: {
    // ssl: process.env.DATABASE_URL ? true : false
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false,
    // },
  },
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("Connected to the database successfully..."))
  .catch((error) => {
    throw new Error("Unable to connect to the database: " + error);
  });

(async function createTables() {
try {
await sequelize.sync({ force: true });
await sequelize.model("User").create({
  fullName: "admin",
  email: "admin@gmail.com",
  password: "admin12345",
  role: "admin",
});

console.log("Tables created successfully...")
  } catch (error) {
    console.log(error);
  }
})();

module.exports = sequelize;
