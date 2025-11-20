// models/index.js

// Import models
const User = require("./user");
const Student = require("./student");
const Teacher = require("./teacher");
const Admin = require("./admin");
const Class = require("./class");
const Course = require("./course");
const Exam = require("./exam");
const StudentCourse = require("./studentCourse");
const ExamResult = require("./examResult");
const Timetable = require("./timeTable");
const Attendance = require("./attendance");

// =====================
// Teacher <-> Course Many-to-Many
// =====================
Teacher.belongsToMany(Course, {
  through: "TeacherCourses",
  foreignKey: "teacherId",
  as: "courseId",
});

Course.belongsToMany(Teacher, {
  through: "TeacherCourses",
  foreignKey: "courseId",
  as: "teacherId",
});

// STUDENT <-> COURSE
StudentCourse.belongsTo(Student, { foreignKey: "studentId", as: "student" });
StudentCourse.belongsTo(Course, { foreignKey: "courseId", as: "course" });
// ==========
// One Course can have many Exams
Course.hasMany(Exam, { foreignKey: "courseId" });
Exam.belongsTo(Course, { foreignKey: "courseId" });

// Student -> ExamResult
Student.hasMany(ExamResult, { foreignKey: "studentId" });
ExamResult.belongsTo(Student, { foreignKey: "studentId" });

// Exam -> ExamResult
Exam.hasMany(ExamResult, { foreignKey: "examId" });
ExamResult.belongsTo(Exam, { foreignKey: "examId" });

// Class -> Timetable
Class.hasMany(Timetable, { foreignKey: "classId" });
Timetable.belongsTo(Class, { foreignKey: "classId" });

// Course -> Timetable
Course.hasMany(Timetable, { foreignKey: "courseId" });
Timetable.belongsTo(Course, { foreignKey: "courseId" });

// Student -> Attendance
Student.hasMany(Attendance, { foreignKey: "studentId" });
Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });

// Course -> Attendance
Course.hasMany(Attendance, { foreignKey: "courseId" });
Attendance.belongsTo(Course, { foreignKey: "courseId", as: "course" });
// =====================
// Export everything
// =====================
module.exports = {
  User,
  Student,
  Teacher,
  Admin,
  Class,
  Course,
  StudentCourse,
};
