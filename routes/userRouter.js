const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  isAdmin,
} = require("../middlewares/authMiddleware.js");
const userController = require("../controllers/userController.js");
router.get("/count", userController.countData);
router.route("/profile").get(authenticateToken, userController.userProfile);
router.route("/login").post(userController.login);
router.route("/refresh-token").post(userController.refreshToken);
router.route("/logout").post(userController.logout);
router
  .route("/update-password")
  .post(authenticateToken, isAdmin, userController.updatePassword);

router
  .route("/")
  .get(authenticateToken, isAdmin, userController.getAll)
  .post(authenticateToken, isAdmin, userController.createUser);

router
  .route("/delete-many")
  .patch(authenticateToken, isAdmin, userController.deleteMany);
router
  .route("/:id")
  .get(authenticateToken, isAdmin, userController.getOneById)
  .delete(authenticateToken, isAdmin, userController.deleteOne);
module.exports = router;
