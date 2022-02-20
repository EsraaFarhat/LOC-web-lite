const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");

class GlobalIdentifier extends Model {}

GlobalIdentifier.init(
  {
    gid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      unique: true,
    },
    sync: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "GlobalIdentifier",
  }
);

module.exports = GlobalIdentifier;
