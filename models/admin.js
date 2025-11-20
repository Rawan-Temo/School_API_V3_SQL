// models/Admin.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");
const User = require("./user");

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true, // optional: ensures valid email format
      },
    },
  },
  {
    paranoid: true,
    tableName: "admins",
    timestamps: true, // adds createdAt and updatedAt
  }
);
module.exports = Admin;
