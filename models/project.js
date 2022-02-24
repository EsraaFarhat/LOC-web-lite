const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const GlobalIdentifier = require("./globalidentifier");

class Project extends Model {}

Project.init(
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
    // sync: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    // },
  },
  {
    sequelize,
    modelName: "Project",
  }
);

GlobalIdentifier.hasMany(Project, {
  foreignKey: "gid",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Project.belongsTo(GlobalIdentifier, {
  foreignKey: "gid",
});

module.exports = Project;
