const Exam = require("../models/exam");
const ExamResult = require("../models/examResult");
const { Quiz } = require("../models/quiz");
const Student = require("../models/student");
const createController = require("../utils/createControllers");

// default controllers for ExamResult model
//TODO NEW GET ALL EXAM RESULTS
const examResultController = createController(ExamResult, "examResult", "", [
  "exam",
  "student",
  "quiz",
]);

// Add a new exam result

/// Update a specific exam result by ID

const countData = async (req, res) => {
  try {
    const numberOfDocuments = await ExamResult.countDocuments({ active: true });
    // Step 2: Return success response
    res.status(200).json({
      status: "success",
      numberOfDocuments,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
const oneResult = async (req, res) => {
  try {
    let where = { id: req.params.id };

    // Student can only see his own result
    if (req.user.role === "Student") {
      where.studentId = req.user.profileId;
    }

    const doc = await ExamResult.findOne({
      where,
      include: [
        { model: Exam, as: "exam" },
        { model: Student, as: "student" },
        { model: Quiz, as: "quiz" },
      ],
    });

    console.log(doc);
    if (!doc) {
      return res.status(404).json({ message: `Not found` });
    }

    res.status(200).json({
      status: "success",
      data: doc,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = {
  ...examResultController,
  countData,
  oneResult,
};
