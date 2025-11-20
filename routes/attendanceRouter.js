const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController.js");
const {
  authenticateToken,
  isAdmin,
  isTeacher,
  isStudent,
  attachTeacherQuery,
  attachTeacherBody,
} = require("../middlewares/authMiddleware.js");
router.get(
  "/count",
  authenticateToken,
  isTeacher,
  attendanceController.countData
);

router
  .route("/")
  .get(authenticateToken, isTeacher, attendanceController.getAll)
  .post(authenticateToken, isTeacher, attendanceController.createAttendance);

router
  .route("/delete-many")
  .patch(authenticateToken, isAdmin, attendanceController.deleteMany);
router
  .route("/:id")
  .patch(authenticateToken, isTeacher, attendanceController.updateAttendance);

module.exports = router;
