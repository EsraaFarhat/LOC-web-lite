const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");

const sequelize = require("../db/postgres/db");
const LOC = require("./LOC");

class User extends Model {
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    fullName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM,
      values: ["admin", "super user", "user"],
      defaultValue: "user",
    },
    token: {
      // type: DataTypes.ARRAY(DataTypes.JSON),
      // defaultValue: [],
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "User",
  }
);

User.hasMany(User, {
  foreignKey: "sup_id",
  as: "users",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.belongsTo(User, {
  foreignKey: "sup_id",
  as: "supervisor",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.hasMany(LOC, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

LOC.belongsTo(User, {
  foreignKey: "user_id",
});

User.beforeCreate(async (user, options) => {
  const hashedPassword = await user.hashPassword(user.password);
  user.password = hashedPassword;
});

User.beforeUpdate(async (user, options) => {
  if (user.changed("password")) {
    const hashedPassword = await user.hashPassword(user.password);
    user.password = hashedPassword;
  }
});

module.exports = User;
