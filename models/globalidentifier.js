const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const Organization = require("./organization");

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
      // unique: true,
    },
    privacy: {
      type: DataTypes.ENUM,
      values: ["public", "private"],
      defaultValue: "public",
    },
    // sync: {
    //   type: DataTypes.BOOLEAN,
    //   defaultValue: false,
    // },
  },
  {
    sequelize,
    modelName: "GlobalIdentifier",
  }
);

Organization.hasMany(GlobalIdentifier, {
  foreignKey: "org_id",
  as: "globalIdentifiers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

GlobalIdentifier.belongsTo(Organization, {
  foreignKey: "org_id",
  as: "organization",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = GlobalIdentifier;
