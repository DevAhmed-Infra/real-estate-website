const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validationMiddleware");
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// Email verification - supports both query param and path param for flexibility
router.get("/verify-email", authController.verifyEmail);
router.get("/verify-email/:token", authController.verifyEmail);

router.post("/logout", protect, authController.logout);

module.exports = router;
