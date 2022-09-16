const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const User = require("./user");

class UserToken extends Model {}

UserToken.init(
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
    token: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: "UserToken",
  }
);

module.exports = UserToken;
