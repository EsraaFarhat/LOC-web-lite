const { DataTypes, Model } = require("sequelize");
const sequelize = require("../db/postgres/db");
const GlobalIdentifier = require("./globalidentifier");
const User = require("./user");

class UserGlobalIdentifier extends Model {}

UserGlobalIdentifier.init(
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
    modelName: "UserGlobalIdentifier",
  }
);

GlobalIdentifier.hasMany(UserGlobalIdentifier, {
  foreignKey: "gid",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

UserGlobalIdentifier.belongsTo(GlobalIdentifier, {
  foreignKey: "gid",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.hasMany(UserGlobalIdentifier, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

UserGlobalIdentifier.belongsTo(User, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});


module.exports = UserGlobalIdentifier;
