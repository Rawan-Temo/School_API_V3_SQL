const bcrypt = require("bcrypt");
const User = require("../models/user");
const Admin = require("../models/admin");

async function createDefaultAdmin() {
  try {
    const adminUser = await User.findOne({ where: { role: "Admin" } });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      // Create admin profile
      const admin = await Admin.create({
        firstName: "default",
        middleName: "default",
        lastName: "default",
        email: "default@default.com",
      });

      // Create user linked to admin (profile id is admin.id)
      await User.create({
        username: "admin",
        password: hashedPassword,
        role: "Admin",
        profileId: admin.id,
      });

      console.log("🟢 Default admin user created.");
    } else {
      console.log("ℹ️ Admin user already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
}

module.exports = createDefaultAdmin;
