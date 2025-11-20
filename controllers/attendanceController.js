const Attendance = require("../models/attendance");
const Course = require("../models/course");
const StudentCourse = require("../models/studentCourse");
const Student = require("../models/student");
const APIFeatures = require("../utils/apiFeatures");
const { Op } = require("sequelize");
const createController = require("../utils/createControllers");

// Default CRUD via your createController
const attendanceController = createController(
  Attendance,
  "attendance",
  ["status"], // you can add fields to search
  ["student", "course"] // associations
);

// 📌 Count Attendance Records
const countData = async (req, res) => {
  try {
    const count = await Attendance.count({ where: { active: true } });

    res.status(200).json({
      status: "success",
      numberOfDocuments: count,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// 📌 Create Attendance with Teacher Verification
const createAttendance = async (req, res) => {
  try {
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const { courseId } = req.body;

      const course = await Course.findOne({
        where: { id: courseId },
      });

      if (!course) return res.status(404).json({ message: "Course not found" });

      // Verify teacher teaches this course
      const teacherCourses = await course.getTeacherId();
      console.log(teacherCourses);
      if (!teacherCourses.map((t) => t.id).includes(teacherId))
        return res.status(403).json({ message: "Not allowed" });
    }

    const studentCourseRe = await StudentCourse.findOne({
      where: {
        studentId: req.body.studentId,
        courseId: req.body.courseId,
      },
    });
    if (!studentCourseRe) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const attendance = await Attendance.create(req.body);
    return res.status(201).json(attendance);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 📌 Update Attendance Only If Teacher Owns the Course
const updateAttendance = async (req, res) => {
  try {
    const id = req.params.id;

    const attendance = await Attendance.findByPk(id);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;

      const course = await Course.findOne({
        where: { id: attendance.courseId },
      });

      const teacherCourses = await course.getTeachers();
      if (!teacherCourses.map((t) => t.id).includes(teacherId))
        return res.status(403).json({ message: "Not allowed" });
    }
    if (
      (req.body.studentId || req.body.courseId) &&
      req.user.role === "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not allowed to update these fields" });
    }

    await attendance.update(req.body, {
      where: { id },
      returning: true,
    });
    console.log(attendance);

    return res.json(attendance);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 📌 Get Attendance List For Course With Pagination + Student Names
const allAttendances = async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });

    // Teacher constraint
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const course = await Course.findByPk(courseId);

      const teacherCourses = await course.getTeachers();
      if (!teacherCourses.map((t) => t.id).includes(teacherId))
        return res.status(403).json({ message: "Not allowed" });
    }

    // Get enrolled student IDs
    const students = await StudentCourse.findAll({
      where: { courseId },
      attributes: ["studentId"],
    });

    const studentIds = students.map((s) => s.studentId);

    const features = new APIFeatures(Attendance, req.query, [
      { model: Student, as: "student", attributes: ["firstName", "lastName"] },
    ]).filter();

    features.options.where.studentId = { [Op.in]: studentIds };

    const [data, total] = await features.execute();

    res.status(200).json({
      status: "success",
      total,
      results: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ...attendanceController,
  countData,
  updateAttendance,
  createAttendance,
  allAttendances,
};
