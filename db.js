const { Sequelize } = require("sequelize");
require("dotenv").config();

const db_name = process.env.DATABASE_NAME;
const db_username = process.env.DATABASE_USERNAME;
const db_password = process.env.DATABASE_PASSWORD;
const db_host = process.env.DATABASE_HOST;
const db_dialect = process.env.DATABASE_DIALECT;
const sequelize = new Sequelize(db_name, db_username, db_password, {
  host: db_host,
  dialect: db_dialect,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log("Connected to the database successfully..."))
  .catch((error) => {
    throw new Error("Unable to connect to the database: " + error);
});


module.exports = sequelize;
