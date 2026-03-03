const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const authService = require("../services/authService");

const JWT_COOKIE_DAYS = parseInt(process.env.JWT_COOKIE_DAYS, 10) || 90;

function setAuthCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  };

  res.cookie("jwt", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: JWT_COOKIE_DAYS * 24 * 60 * 60 * 1000,
  });
}

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body,
  );
  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    status: "success",
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const { user, accessToken, refreshToken } = await authService.loginUser(
    email,
    password,
  );
  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken } =
    await authService.refreshAccessToken(token);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      accessToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (req.user) {
    await authService.logoutUser(req.user.id, refreshToken);
  }

  res.clearCookie("jwt");
  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      message: "Logged out successfully",
    },
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  await authService.requestPasswordReset(email);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      message:
        "If an account with that email exists, a reset link has been sent.",
    },
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new AppError("Token and new password are required", 400);
  }

  await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      message: "Password reset successful. You can now log in.",
    },
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  // Support both query param and path param for maximum flexibility
  const token = req.query.token || req.params.token;

  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  await authService.verifyEmail(token);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      message: "Email verified successfully. You can now log in.",
    },
  });
});

module.exports = {
  resetPassword,
  forgotPassword,
  logout,
  refreshToken,
  login,
  register,
  verifyEmail,
};
