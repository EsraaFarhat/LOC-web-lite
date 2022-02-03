const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db");
const GlobalIdentifier = require("./globalidentifier");
const Log = require("./log");
const User = require("./user");

class UserLogGid extends Model {}

UserLogGid.init(
  {
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "user_id",
      },
      primaryKey: true,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    log_id: {
      type: DataTypes.UUID,
      references: {
        model: Log,
        key: "id",
      },
      primaryKey: true,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    gid: {
      type: DataTypes.UUID,
      references: {
        model: GlobalIdentifier,
        key: "gid",
      },
      primaryKey: true,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "UserLogGid",
  }
);

module.exports = UserLogGid;
