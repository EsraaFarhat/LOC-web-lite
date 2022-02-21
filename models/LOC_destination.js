const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const LOC = require("./LOC");

class LOCDestination extends Model {}

LOCDestination.init(
  {
    destination_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loc_id: {
      type: DataTypes.UUID,
      references: {
        model: LOC,
        key: "loc_id",
      },
      primaryKey: true,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    destination: {
      type: DataTypes.STRING(100),
    },
    destination_field_1: {
      type: DataTypes.STRING(200),
    },
    destination_field_2: {
      type: DataTypes.STRING(200),
    },
    destination_field_3: {
      type: DataTypes.STRING(200),
    },
    sync: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    method: {
      type: DataTypes.ENUM,
      values: ["POST", "PATCH", "DELETE"],
      defaultValue: "POST",
    },
  },
  {
    sequelize,
    modelName: "LOCDestination",
  }
);

LOC.hasOne(LOCDestination, {
  foreignKey: "loc_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

LOCDestination.belongsTo(LOC, {
  foreignKey: "loc_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = LOCDestination;
