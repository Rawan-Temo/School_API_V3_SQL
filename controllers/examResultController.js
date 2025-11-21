const Exam = require("../models/exam");
const ExamResult = require("../models/examResult");
const Student = require("../models/student");
const createController = require("../utils/createControllers");

// default controllers for ExamResult model

const examResultController = createController(ExamResult, "examResult", "", [
  "exam",
  "student",
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
    let query;
    if (req.user.role === "Student") {
      query = ExamResult.findOne({
        where: {
          id: req.params.id,
          studentId: req.user.profileId,
        },
        include: {
          model: Exam,
          as: "exam",
          through: { attributes: [] },
        },
      });
    } else {
      query = ExamResult.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Exam,
            as: "exam",
            through: { attributes: [] },
          },
          {
            model: Student,
            as: "student",
            through: { attributes: [] },
          },
        ],
      });
    }
    const doc = await query;

    if (!doc) {
      return res.status(404).json({ message: ` not found` });
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
