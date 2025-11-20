// models/Quiz.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize");
const Course = require("./course");

// ==================
// Quiz Model
// ==================
const Quiz = sequelize.define(
  "Quiz",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    courseId: { type: DataTypes.INTEGER, allowNull: true },
    duration: { type: DataTypes.INTEGER, allowNull: false }, // in minutes
    description: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    totalMarks: { type: DataTypes.INTEGER, defaultValue: 100 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "quizzes",
    timestamps: true,
  }
);

// ==================
// Question Model
// ==================
const Question = sequelize.define(
  "Question",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quizId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM("multiple-choice", "true-false"),
      allowNull: false,
    },
    correctAnswer: { type: DataTypes.STRING, allowNull: true }, // only for true-false
  },
  {
    tableName: "questions",
    timestamps: true,
  }
);

// ==================
// Choice Model
// ==================
const Choice = sequelize.define(
  "Choice",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
  },
  {
    tableName: "choices",
    timestamps: true,
  }
);

// ==================
// Associations
// ==================

// Quiz -> Course
Course.hasMany(Quiz, { foreignKey: "courseId" });
Quiz.belongsTo(Course, { foreignKey: "courseId" });

// Quiz -> Question
Quiz.hasMany(Question, { foreignKey: "quizId", onDelete: "CASCADE" });
Question.belongsTo(Quiz, { foreignKey: "quizId" });

// Question -> Choice
Question.hasMany(Choice, { foreignKey: "questionId", onDelete: "CASCADE" });
Choice.belongsTo(Question, { foreignKey: "questionId" });

// Export all in one file
module.exports = { Quiz, Question, Choice };
