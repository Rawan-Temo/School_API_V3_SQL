const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController.js");
const {
  authenticateToken,
  isAdmin,
  isStudent,
} = require("../middlewares/authMiddleware.js");
router.get("/count", authenticateToken, courseController.countData);

router
  .route("/")
  .get(authenticateToken, isStudent, courseController.allCourses)
  .post(authenticateToken, isAdmin, courseController.createCourse);
router
  .route("/deactivate-many")
  .patch(authenticateToken, isAdmin, courseController.deactivateMany);

router
  .route("/delete-many")
  .patch(authenticateToken, isAdmin, courseController.deleteMany);

router
  .route("/deactivate/:id")
  .patch(authenticateToken, isAdmin, courseController.deactivateOne);

router
  .route("/:id")
  .get(authenticateToken, isStudent, courseController.getCourseById)
  .patch(authenticateToken, isAdmin, courseController.updateCourse)
  .delete(authenticateToken, isAdmin, courseController.deleteCourse);

module.exports = router;
