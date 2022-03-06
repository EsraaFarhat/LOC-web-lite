const sequelize = require("./db");

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