// models/Class.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const Class = sequelize.define(
  "Class",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { paranoid: true, tableName: "classes", timestamps: true }
);

module.exports = Class;
