// models/StudentCourse.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const StudentCourse = sequelize.define(
  "StudentCourse",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("Active", "Completed", "Dropped"),
      allowNull: true,
    },
  },
  {
    tableName: "student_courses",
    timestamps: true,
  }
);

module.exports = StudentCourse;
