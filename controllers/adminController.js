const Admin = require("../models/admin");
const createController = require("../utils/createControllers");
// Get all admin s
const adminController = createController(Admin, "Admin", [
  "firstName",
  "email",
]);

const countData = async (req, res) => {
  try {
    const numberOfDocuments = await Admin.countDocuments({ active: true });
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
  ...adminController,
  countData,
};
