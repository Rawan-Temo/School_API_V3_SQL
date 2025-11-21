const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const {
  authenticateToken,
  isAdmin,
  isTeacher,
  isStudent,
} = require("../middlewares/authMiddleware.js");
// Quiz routes
router
  .route("/")
  .post(authenticateToken, isTeacher, quizController.createQuiz)
  .get(authenticateToken, isStudent, quizController.getAllQuizzes);

router
  .route("/submit")
  .post(authenticateToken, isStudent, quizController.submitQuiz);


router
  .route("/:id")
  .get(authenticateToken, isStudent, quizController.getQuizById)
  .patch(authenticateToken, isTeacher, quizController.updateQuiz)
  .delete(authenticateToken, isTeacher, quizController.deleteQuiz);

// // Question routes

// router
//   .route("/:quizId/questions")
//   .get(authenticateToken, isStudent, quizController.getAllQuestions);

// router
//   .route("/:quizId/questions/:questionId")
//   .get(authenticateToken, isStudent, quizController.getQuestionById);
//   .patch(quizController.updateQuestion)
//   .delete(quizController.deleteQuestion);

// // Choice routes
// router.route("/choices")
//   .post(choiceController.createChoice)
//   .get(choiceController.getAllChoices);

// router.route("/choices/:id")
//   .get(choiceController.getChoiceById)
//   .patch(choiceController.updateChoice)
//   .delete(choiceController.deleteChoice);

module.exports = router;
