require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet"); // For security enhancements
const app = express();
const port = process.env.PORT || 8000;
const path = require("path");
const rateLimit = require("express-rate-limit");

// Import routers
const teacherRouter = require("./routes/teacherRouter.js");
const courseRouter = require("./routes/courseRouter.js");
const classRouter = require("./routes/classRouter.js");
const studentRouter = require("./routes/studentRouter.js");
const attendanceRouter = require("./routes/attendanceRouter.js");
const examRouter = require("./routes/examRouter.js");
const examResultsRouter = require("./routes/examResultRouter.js");
const timeTableRouter = require("./routes/timeTableRouter.js");
const adminRouter = require("./routes/adminRouter.js");
const userRouter = require("./routes/userRouter.js");
const quizRouter = require("./routes/quizRouter.js");
const studentCourseRouter = require("./routes/studentCourseRouter.js");
// Import and initialize database connection
const { connectDB } = require("./db");
const cookieParser = require("cookie-parser");
connectDB();

// Middleware
app.use(express.json()); // Built-in JSON parser
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    //it chokes on 204
    optionsSuccessStatus: 200,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"));
app.use(helmet()); // Security middleware

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  })
);
app.use(
  "/api/users/login",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  })
);
// API Routes
// 404 Handler
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/classes", classRouter);
app.use("/api/courses", courseRouter);
app.use("/api/attendances", attendanceRouter);
app.use("/api/exams", examRouter);
app.use("/api/exam-results", examResultsRouter);
app.use("/api/time-table", timeTableRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/admins", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/student-courses", studentCourseRouter);

app.use(express.static(path.join(__dirname, "../client/build"))); // Make sure this path is correct
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

app.use((req, res, next) => {
  res.status(404).json({ status: "fail", message: "Route not found" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({ status: "error", message: "Something went wrong" });
});

// Start the server
app.listen(port, () => {
  console.log("Listening on port:", port);
});
