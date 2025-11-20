const TimeTable = require("../models/timeTable");
const createController = require("../utils/createControllers");

const timeTableController = createController(TimeTable, "timeTable", "", [
  "course",
  "class",
]);
/// Get all timetables

module.exports = timeTableController;
