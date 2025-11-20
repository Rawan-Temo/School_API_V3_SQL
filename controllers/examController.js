const Course = require("../models/course");
const Exam = require("../models/exam");
const createController = require("../utils/createControllers");

const examController = createController(Exam, "Exam", ["title"], ["course"]);

const countData = async (req, res) => {
  try {
    const numberOfDocuments = await Exam.countDocuments({ active: true });
    // Step 2: Return success response
    res.status(200).json({
      status: "success",
      numberOfDocuments,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

module.exports = {
  ...examController,
  countData,
};
