// models/Timetable.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const Timetable = sequelize.define(
  "Timetable",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., "09:00"
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "timetables",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["classId", "courseId", "dayOfWeek", "startTime"],
        where: {
          active: true,
        },
      },
    ],
  }
);

module.exports = Timetable;
