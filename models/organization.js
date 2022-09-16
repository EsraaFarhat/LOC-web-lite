const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Organization",
  }
);

module.exports = Organization;
