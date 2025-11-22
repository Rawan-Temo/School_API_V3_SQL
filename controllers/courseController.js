const Course = require("../models/course");
const Teacher = require("../models/teacher");
const APIFeatures = require("../utils/apiFeatures");
const createController = require("../utils/createControllers");
const { search } = require("../utils/search");
// Get default controllers for
// Course model

const courseController = createController(
  Course,
  "course",
  ["name", "code"],
  ["teacherId"]
);

const countData = async (req, res) => {
  try {
    const numberOfDocuments = await Course.count();
    // Step 2: Return success response
    res.status(200).json({
      status: "success",
      numberOfDocuments,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
const allCourses = async (req, res) => {
  try {
    // Check if teacher filter is requested
    const include = [];

    if (req.query.teacherId) {
      console.log(req.query.teacherId);
      include.push({
        model: Teacher,
        as: "teacherId",
        where: { id: req.query.teacherId },
        through: { attributes: [] },
        required: true,
      });
      delete req.query.teacherId;
    } else {
      include.push({
        model: Teacher,
        as: "teacherId",
        through: { attributes: [] },
      });
    }
    if (req.query.search) {
      return await search(
        Course,
        "course",
        ["name", "code"],
        req,
        res,
        include
      );
    }
    const features = new APIFeatures(Course, req.query, include)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const courses = await features.findAll();

    const total = await features.countWithInclude(include);

    return res.status(200).json({
      status: "success",
      results: courses.length,
      total,
      data: courses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { teacherId, ...courseData } = req.body;

    const course = await Course.create(courseData);

    if (teacherId) {
      // support multiple or single teacher
      const teacherList = Array.isArray(teacherId) ? teacherId : [teacherId];
      console.log(req.body.teacherId);
      await course.setTeacherId(teacherList);
    }

    const createdWithTeachers = await Course.findByPk(course.id, {
      include: { model: Teacher, as: "teacherId", through: { attributes: [] } },
    });

    return res.status(201).json({
      status: "success",
      data: createdWithTeachers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

// 📌 GET a single Course
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: { model: Teacher, as: "teacherId", through: { attributes: [] } },
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json({ status: "success", data: course });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { teacherId, ...updateData } = req.body;

    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    await course.update(updateData);

    // Update teachers only if provided
    if (teacherId) {
      const teacherList = Array.isArray(teacherId) ? teacherId : [teacherId];
      await course.setTeacherId(teacherList);
    }

    const updated = await Course.findByPk(course.id, {
      include: { model: Teacher, as: "teacherId", through: { attributes: [] } },
    });

    return res.status(200).json({ status: "success", data: updated });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🗑️ DELETE course (no cascade)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    await course.destroy(); // will not delete teachers
    return res.status(204).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

module.exports = {
  ...courseController,
  countData,
  allCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
};
