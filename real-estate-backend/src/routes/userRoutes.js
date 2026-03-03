const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { restrictTo } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validationMiddleware");
const { uploadProfilePhoto } = require("../utils/upload");
const {
  userUpdateSchema,
  adminCreateUserSchema,
  passwordChangeSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router.get("/me", userController.getMe);
router.put(
  "/me",
  uploadProfilePhoto,
  validate(userUpdateSchema),
  userController.updateMe,
);
router.post("/me/photo", uploadProfilePhoto, userController.uploadProfilePhoto);
router.delete("/me/photo", userController.deleteProfilePhoto);
router.patch(
  "/me/password",
  validate(passwordChangeSchema),
  userController.changeMyPassword,
);
router.delete("/deleteMe", userController.deleteMe);

router.get("/", restrictTo("admin"), userController.getUsers);
router.post(
  "/",
  restrictTo("admin"),
  validate(adminCreateUserSchema),
  userController.createUser,
);
router.get("/:id", restrictTo("admin"), userController.getUser);
router.patch(
  "/:id",
  restrictTo("admin"),
  validate(userUpdateSchema),
  userController.updateUser,
);
router.delete("/:id", restrictTo("admin"), userController.deleteUser);

module.exports = router;
