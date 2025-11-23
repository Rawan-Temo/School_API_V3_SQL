const { Quiz, Question, Choice } = require("../models/quiz.js");
const Course = require("../models/course.js");
const APIFeatures = require("../utils/apiFeatures");
const ExamResult = require("../models/examResult.js");
const { Op } = require("sequelize");
const Teacher = require("../models/teacher.js");
// TODO fix the update
// Get all quizzes with APIFeatures and optional teacherId filter
const getAllQuizzes = async (req, res) => {
  try {
    const options = {
      include: [
        {
          model: Course,
          as: "Course",
          include: [{ model: Teacher, as: "teacherId", attributes: ["id"] }],
        },
      ],
      where: {},
    };

    if (req.query.teacherId) {
      options.include[1].where = { id: req.query.teacherId };
    }

    const features = new APIFeatures(Quiz, req.query, options.include)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [quizzes, count] = await features.execute();

    // Hide answers for students
    if (req.user.role === "Student") {
      quizzes.forEach((quiz) => {
        quiz.Questions?.forEach((q) => {
          if (q.type === "true-false") q.correctAnswer = null;
          else {
            q.Choices?.forEach((c) => (c.isCorrect = null));
          }
        });
      });
    }

    res.status(200).json({
      status: "success",
      results: quizzes.length,
      numberOfQuizzes: count,
      data: quizzes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Get quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Question,
          as: "Questions",
          include: [{ model: Choice, as: "Choices" }],
        },
        {
          model: Course,
          as: "Course",
          include: [{ model: Teacher, as: "teacherId" }],
        },
      ],
    });

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === "Student") {
      quiz.Questions?.forEach((q) => {
        if (q.type === "true-false") q.correctAnswer = null;
        else q.Choices?.forEach((c) => (c.isCorrect = null));
      });
    }

    res.status(200).json({ status: "success", data: quiz });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Create a new quiz
const createQuiz = async (req, res) => {
  try {
    console.log(req.body);
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const courseId = req.body.courseId;

      if (!courseId)
        return res.status(400).json({ message: "courseId is required" });

      const course = await Course.findOne({
        where: { id: courseId },
        include: [
          {
            model: Teacher,
            as: "teacherId", // the alias you defined in your association
            where: { id: teacherId }, // filter only teachers matching this ID
          },
        ],
      });
      if (!course)
        return res
          .status(403)
          .json({ message: "Not allowed or course not found" });
    }

    const newQuiz = await Quiz.create(req.body);

    // add the questoins and the choices to the quiz

    if (req.body.questions && Array.isArray(req.body.questions)) {
      for (const questionData of req.body.questions) {
        const question = await Question.create({
          ...questionData,
          quizId: newQuiz.id,
        });
        if (questionData.choices && Array.isArray(questionData.choices)) {
          for (const choiceData of questionData.choices) {
            await Choice.create({
              ...choiceData,
              questionId: question.id,
            });
          }
        }
      }
    }

    res.status(201).json({ status: "success", data: newQuiz });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Update quiz and replace questions
const updateQuiz = async (req, res) => {
  const t = await Quiz.sequelize.transaction();
  try {
    const quiz = await Quiz.findByPk(req.params.id, { transaction: t });
    if (!quiz) {
      await t.rollback();
      return res.status(404).json({ message: "Quiz not found" });
    }

    // ===== PERMISSION CHECK FOR TEACHERS =====
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const course = await Course.findOne({
        where: { id: quiz.courseId },
        include: [
          { model: Teacher, as: "teacherId", where: { id: teacherId } },
        ],
        transaction: t,
      });
      if (!course) {
        await t.rollback();
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    // 1) Update quiz basic fields
    await quiz.update(req.body, { transaction: t });

    // 2) Replace all questions & choices if provided
    if (Array.isArray(req.body.questions)) {
      // Delete old questions + choices
      await Question.destroy({ where: { quizId: quiz.id }, transaction: t });
      // Choices will be auto-deleted only if you enabled CASCADE.
      // If not, then add: await Choice.destroy({ where: { questionId: ids... }, transaction:t });

      // 3) Insert new questions + choices
      for (const q of req.body.questions) {
        const newQuestion = await Question.create(
          { ...q, quizId: quiz.id },
          { transaction: t }
        );

        if (Array.isArray(q.choices)) {
          for (const c of q.choices) {
            await Choice.create(
              { ...c, questionId: newQuestion.id },
              { transaction: t }
            );
          }
        }
      }
    }

    await t.commit();

    // Get updated quiz back
    const updatedQuiz = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: Question,
          as: "Questions",
          include: [{ model: Choice, as: "Choices" }],
        },
        {
          model: Course,
          as: "Course",
          include: [{ model: Teacher, as: "teacherId" }],
        },
      ],
    });

    return res.status(200).json({ status: "success", data: updatedQuiz });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;
      const course = await Course.findOne({
        where: { id: quiz.courseId },
        include: [
          {
            model: Teacher,
            as: "teacherId", // the alias you defined in your association
            where: { id: teacherId }, // filter only teachers matching this ID
          },
        ],
      });
      if (!course) return res.status(403).json({ message: "Not allowed" });
    }

    await quiz.destroy();
    res
      .status(200)
      .json({ status: "success", message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Submit quiz
const submitQuiz = async (req, res) => {
  try {
    if (req.user.role !== "Student")
      return res.status(403).json({ message: "Only students can submit" });

    const { studentAnswers, quizId } = req.body;
    const studentId = req.user.profileId;

    if (!quizId || !Array.isArray(studentAnswers))
      return res.status(400).json({ message: "quizId and answers required" });

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Question,
          as: "Questions",
          include: [{ model: Choice, as: "Choices" }],
        },
      ],
    });

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const existing = await ExamResult.findOne({
      where: { quizId: quizId, studentId },
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "You already submitted this quiz", existing });

    const ids = studentAnswers.map((a) => String(a.questionId));
    if (ids.length !== new Set(ids).size)
      return res
        .status(400)
        .json({ message: "Multiple answers per question not allowed" });

    const validQuestionIds = new Set(quiz.Questions.map((q) => String(q.id)));
    for (const id of ids)
      if (!validQuestionIds.has(id))
        return res.status(400).json({ message: "Invalid question submitted" });

    let correctCount = 0;
    for (const q of quiz.Questions) {
      const ans = studentAnswers.find(
        (a) => String(a.questionId) === String(q.id)
      );
      if (!ans) continue;

      let correctAnswer;
      if (q.type === "true-false") correctAnswer = String(q.correctAnswer);
      else correctAnswer = String(q.Choices.find((c) => c.isCorrect)?.text);

      if (String(ans.answer) === correctAnswer) correctCount++;
    }

    const score = (quiz.totalMarks * correctCount) / quiz.Questions.length;
    const examResult = await ExamResult.create({
      quizId: quizId,
      studentId,
      score,
      type: "Quiz",
    });

    res.status(200).json({
      status: "success",
      message: `Score: ${score}/${quiz.totalMarks}`,
      data: examResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};
// Delete multiple quizzes
const deleteManyQuizzes = async (req, res) => {
  const t = await Quiz.sequelize.transaction();
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    // Get all quizzes requested
    const quizzes = await Quiz.findAll({
      where: { id: ids },
      include: [
        {
          model: Course,
          as: "Course",
          include: [{ model: Teacher, as: "teacherId" }],
        },
      ],
      transaction: t,
    });

    if (quizzes.length !== ids.length) {
      await t.rollback();
      return res.status(404).json({ message: "Some quizzes were not found" });
    }

    // ===== AUTHORIZATION FOR TEACHER =====
    if (req.user.role === "Teacher") {
      const teacherId = req.user.profileId;

      // Check every quiz belongs to this teacher
      for (const quiz of quizzes) {
        if (!quiz.Course?.teacherId || quiz.Course.teacherId.id !== teacherId) {
          await t.rollback();
          return res.status(403).json({
            message: `Not allowed to delete quiz with id ${quiz.id}`,
          });
        }
      }
    }

    // ===== AUTHORIZED → DELETE =====
    await Quiz.destroy({
      where: { id: ids },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: `${ids.length} quizzes deleted successfully`,
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};



module.exports = {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  deleteManyQuizzes,
};
