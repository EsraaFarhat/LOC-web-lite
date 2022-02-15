const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const Project = require("./project");
const LOC = require("./LOC");

class Location extends Model {}

Location.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
    },
    longitude: {
      type: DataTypes.FLOAT(),
    },
    latitude: {
      type: DataTypes.FLOAT(),
    },
    radius: {
      type: DataTypes.FLOAT(),
    },
  },
  {
    sequelize,
    modelName: "Location",
  }
);

Project.hasMany(Location, {
  foreignKey: "project_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Location.belongsTo(Project, {
  foreignKey: "project_id",
});

Location.hasOne(LOC, {
  foreignKey: "location_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

LOC.belongsTo(Location, {
  foreignKey: "location_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = Location;
