const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");

class LOC extends Model {}

LOC.init(
  {
    loc_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    route_id: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    origin_id: {
      type: DataTypes.UUID,
      unique: true,
    },
    origin: {
      type: DataTypes.STRING(100),
    },
    field_1: {
      type: DataTypes.STRING(200),
    },
    field_2: {
      type: DataTypes.STRING(200),
    },
    field_3: {
      type: DataTypes.STRING(200),
    },
    MISC: {
      type: DataTypes.STRING(100),
    },
    cable_status: {
      type: DataTypes.ENUM,
      values: ["assigned", "unassigned"],
      defaultValue: "unassigned",
    },
    LOC_type: {
      type: DataTypes.ENUM,
      values: ["single", "dual"],
      allowNull: false,
    },
    sync: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    method: {
      type: DataTypes.ENUM,
      values: ["POST", "PATCH", "DELETE"],
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LOC",
  }
);

module.exports = LOC;
