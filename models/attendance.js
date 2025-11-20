// models/Attendance.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Present", "Absent", "Excused", "Late"),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "attendances",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "courseId", "date"],
        where: {
          active: true,
        },
      },
    ],
  }
);

module.exports = Attendance;
