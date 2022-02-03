const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");

class Log extends Model {}

Log.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    description: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.ENUM,
      values: ["seen", "unseen"],
      defaultValue: "unseen",
    },
  },
  {
    sequelize,
    modelName: "Log",
  }
);



module.exports = Log