const express = require("express");
const router = express.Router();
const examResultController = require("../controllers/examResultController.js");
const {
  authenticateToken,
  isAdmin,
  isTeacher,
  attachStudentQuery,
  createTeacherResultAuth,
  updateTeacherResultAuth,
  deleteTeacherResultAuth,
} = require("../middlewares/authMiddleware.js");
router.get("/count", examResultController.countData);
// TODO fix teacher auth
router
  .route("/")
  .get(authenticateToken, attachStudentQuery, examResultController.getAll)
  .post(
    authenticateToken,
    isTeacher,
    createTeacherResultAuth,
    examResultController.createOne
  );

router
  .route("/deactivate-many")
  .patch(authenticateToken, isAdmin, examResultController.deactivateMany);

router
  .route("/delete-many")
  .patch(
    authenticateToken,
    isTeacher,
    deleteTeacherResultAuth,
    examResultController.deleteMany
  );

router
  .route("/deactivate/:id")
  .patch(authenticateToken, isAdmin, examResultController.deactivateOne);

router
  .route("/:id")
  .get(authenticateToken, attachStudentQuery, examResultController.oneResult)
  .patch(
    authenticateToken,
    isTeacher,
    updateTeacherResultAuth,
    examResultController.updateOne
  )
  .delete(authenticateToken, isAdmin, examResultController.deleteOne);

module.exports = router;
