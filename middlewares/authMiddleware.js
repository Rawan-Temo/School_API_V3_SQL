const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Course = require("../models/course");
const Exam = require("../models/exam");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Assuming Bearer token
  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return res.sendStatus(401); // Invalid token

    const foundUser = await User.findByPk(user.id);
    if (!foundUser) return res.sendStatus(404); // User not found

    req.user = foundUser; // Attach user to request object
    next();
  });
};

const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied." });
};
const isTeacher = async (req, res, next) => {
  if (req.user && (req.user.role === "Admin" || req.user.role === "Teacher")) {
    return next();
  }
  res.status(403).json({ message: "Access denied." });
};
const isStudent = async (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "Admin" ||
      req.user.role === "Teacher" ||
      req.user.role === "Student")
  ) {
    return next();
  }
  res.status(403).json({ message: "Access denied." });
};

// Attach student ID automatically in query for students
const attachStudentQuery = async (req, res, next) => {
  try {
    if (req.user.role === "Student") {
      req.query.studentId = req.user.profileId;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Attach student ID automatically in body for students
const attachStudentBody = async (req, res, next) => {
  try {
    if (req.user.role === "Student") {
      req.body.studentId = req.user.profileId;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Attach teacher ID automatically in query for teachers
const attachTeacherQuery = async (req, res, next) => {
  try {
    if (req.user.role === "Teacher") {
      req.query.teacherId = req.user.profileId;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Attach teacher ID automatically in body for teachers
const attachTeacherBody = async (req, res, next) => {
  try {
    if (req.user.role === "Teacher") {
      req.body.teacherId = req.user.profileId;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Exam authorization for teachers
const createTeacherExamAuth = async (req, res, next) => {
  try {
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const { courseId } = req.body;

      const course = await Course.findOne({
        where: { id: courseId, teacherId },
      });

      if (!course) {
        return res.status(403).json({
          message: "Course not found or unauthorized to create an exam for it",
        });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Exam authorization for teachers
const updateTeacherExamAuth = async (req, res, next) => {
  try {
    const examId = req.params.id;

    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const { courseId } = req.query;

      const exam = await Exam.findByPk(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      const course = await Course.findOne({
        where: {
          id: courseId || exam.courseId,
          teacherId,
        },
      });

      if (!course) {
        return res.status(403).json({
          message: "Course not found or unauthorized to update this exam",
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Exam authorization for teachers
const deleteTeacherExamAuth = async (req, res, next) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "No exam IDs provided" });
    }

    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;

      // Get exams
      const exams = await Exam.findAll({ where: { id: ids } });
      if (!exams.length) {
        return res.status(404).json({ message: "Exams not found" });
      }

      // Get all courseIds from exams
      const courseIds = [...new Set(exams.map((e) => e.courseId))];

      // Check teacher owns all courseIds
      const courses = await Course.findAll({
        where: { id: courseIds, teacherId },
      });

      if (courses.length !== courseIds.length) {
        return res.status(403).json({
          message: "Not authorized to delete one or more of these exams",
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  isTeacher,
  isStudent,
  attachStudentQuery,
  attachStudentBody,
  attachTeacherQuery,
  attachTeacherBody,
  createTeacherExamAuth,
  updateTeacherExamAuth,
  deleteTeacherExamAuth,
};
