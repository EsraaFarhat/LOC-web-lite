const sequelize = require("./db");

require("./models/user");
require("./models/globalidentifier");
require("./models/project");
require("./models/location");
require("./models/LOC");
require("./models/LOC_destination");

(async function createTables() {
  try {
    await sequelize.sync({ force: true });
    // await sequelize.model("User").create({
    //   fullName: "admin",
    //   email: "admin@gmail.com",
    //   password: "admin12345",
    //   role: "admin",
    // });

    console.log("Tables created successfully...");
    process.exit();
} catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
