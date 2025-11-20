// models/ExamResult.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");

const ExamResult = sequelize.define(
  "ExamResult",
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
    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("Exam", "Quiz"),
      allowNull: false,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "exam_results",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "examId"],
      },
    ],
  }
);

module.exports = ExamResult;
