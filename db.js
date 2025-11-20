require("dotenv").config();
const { sequelize } = require("./sequelize");
const createDefaultAdmin = require("./utils/createDefaultAdmin");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("🟢 Database connected!");
    await sequelize.sync({ alter: true }); // creates/updates tables
    console.log("Tables synced");
    createDefaultAdmin();
  } catch (error) {
    console.error("🔴 Database connection failed:", error.message);
  }
};

module.exports = { connectDB };
