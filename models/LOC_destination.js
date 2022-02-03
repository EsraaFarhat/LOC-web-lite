const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const LOC = require("./LOC");
const Location = require("./location");

class LOCDestination extends Model {}

LOCDestination.init(
  {
    destination_id: {
      // !! Should be generated automatically
      type: DataTypes.UUID,
      primaryKey: true,
      // unique: true,
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
  },
  {
    sequelize,
    modelName: "LOCDestination",
  }
);

LOC.hasOne(LOCDestination, {
  foreignKey: 'loc_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

LOCDestination.belongsTo(LOC, {
  foreignKey: "loc_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = LOCDestination;
