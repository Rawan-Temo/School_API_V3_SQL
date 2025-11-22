const { User, Teacher, Student, Admin } = require("../models/models");
const createController = require("../utils/createControllers"); // Keep filtering/sorting helpers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// === Basic CRUD controller ===
const userController = createController(User, "user", ["username"]);

// === Create User ===
const createUser = async (req, res) => {
  try {
    console.log(req.body);
    const { username, password, role, profileId } = req.body;

    // Check if username or profileId exists
    const existingUser = await User.findOne({
      where: {
        username,
      },
    });

    if (existingUser) {
      const message =
        existingUser.username === username
          ? "Username already exists."
          : "Profile ID already exists.";
      return res.status(400).json({ message });
    }

    // Check if profile exists in its table
    let profileExists = false;
    if (role === "Teacher")
      profileExists = await Teacher.findOne({
        where: { id: profileId },
      });
    else if (role === "Student")
      profileExists = await Student.findOne({
        where: { id: profileId },
      });
    else if (role === "Admin")
      profileExists = await Admin.findOne({
        where: { id: profileId },
      });

    if (!profileExists) {
      return res
        .status(400)
        .json({ message: "Profile does not exist or is not active" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || "user",
      profileId: profileId,
    });

    res.status(201).json({
      status: "success",
      data: {
        username: newUser.username,
        role: newUser.role,
        profileId: newUser.profileId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// === Update Password ===
const updatePassword = async (req, res) => {
  try {
    const { newPassword, userId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res
      .status(200)
      .json({ status: "success", message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// === Login ===
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    await user.update({ refreshToken });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, userRole: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === Refresh Token ===
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    await user.update({ refreshToken: newRefreshToken });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// === Count Active Users ===
const countData = async (req, res) => {
  try {
    const numberOfDocuments = await User.count({ where: { active: true } });
    res.status(200).json({ status: "success", numberOfDocuments });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// === User Profile ===
const userProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    let profile;
    if (user.role === "Admin") {
      profile = await Admin.findByPk(user.profileId);
    } else if (user.role === "Teacher") {
      profile = await Teacher.findByPk(user.profileId);
    } else {
      profile = await Student.findByPk(user.profileId);
    }
    user.profileId = profile;
    user.password = undefined;
    user.refreshToken = undefined;
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === Logout ===
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user) await user.update({ refreshToken: null });
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ...userController,
  createUser,
  updatePassword,
  login,
  refreshToken,
  logout,
  countData,
  userProfile,
};
