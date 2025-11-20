const Admin = require("../models/admin");
const Attendance = require("../models/attendance");
const Class = require("../models/class");
const Course = require("../models/course");
const Student = require("../models/student");
const Teacher = require("../models/teacher");
const { Op } = require("sequelize");

module.exports.countDocuments = async (req, res) => {
  try {
    // 1) Copy query object and remove unwanted fields
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) Handle operators like gte, lte etc: age__gte=10
    const where = {};
    for (const key in queryObj) {
      if (key.includes("__")) {
        const [field, operator] = key.split("__");
        if (!where[field]) where[field] = {};
        where[field][Op[operator]] = queryObj[key];
      } else {
        where[key] = queryObj[key];
      }
    }

    // ✔ With paranoid mode, only active (non-deleted) rows are counted automatically
    const [
      classCount,
      courseCount,
      maleStudentCount,
      maleTeacherCount,
      femaleStudentCount,
      femaleTeacherCount,
    ] = await Promise.all([
      Class.count({ where }),
      Course.count({ where }),
      Student.count({ where: { ...where, gender: "Male" } }),
      Teacher.count({ where: { ...where, gender: "Male" } }),
      Student.count({ where: { ...where, gender: "Female" } }),
      Teacher.count({ where: { ...where, gender: "Female" } }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        classCount,
        courseCount,
        maleStudentCount,
        maleTeacherCount,
        femaleStudentCount,
        femaleTeacherCount,
      },
    });
  } catch (error) {
    console.error("Error counting records:", error);
    res.status(500).send("Internal Server Error");
  }
};
