const StudentCourse = require("../models/studentCourse");

const createControllers = require("../utils/createControllers");

const studentCourseController = createControllers(
  StudentCourse,
  "StudentCourse",
  [],
  ["student", "course"]
);

module.exports = studentCourseController;
