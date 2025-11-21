const ExamResult = require("../models/examResult");
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
        _id: req.params.id,
        studentId: req.user.profileId,
      });
    } else {
      query = ExamResult.findOne({ _id: req.params.id });
    }
    query = query.populate([
      { path: "examId", populate: "courseId" },
      { path: "studentId" },
    ]);
    const doc = await query.lean();

    if (!doc) {
      return res.status(404).json({ message: `${name} not found` });
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
