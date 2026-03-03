const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/userModel");
const AppError = require("../utils/appError");
const { sendEmail } = require("../utils/email");
const config = require("../config/appConfig");

const ACCESS_EXPIRES_IN = config.jwtExpiresIn;
const REFRESH_EXPIRES_IN = config.refreshTokenExpiresIn;

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    },
  );
}

function getRefreshTokenSecret() {
  return process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    getRefreshTokenSecret(),
    {
      expiresIn: REFRESH_EXPIRES_IN,
    },
  );
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function registerUser(data) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use", 400);
  }

  // Create user without manual hashing - let the model pre-save hook handle it
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password, // Let pre-save hook handle hashing
    role: data.role || "buyer",
    phone: data.phone,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedRefresh = await bcrypt.hash(refreshToken, 12);

  user.refreshTokens.push({
    token: hashedRefresh,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  user.emailVerificationTokenHash = hashedToken;
  user.emailVerificationTokenExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ); // 24 hours
  await user.save();

  // Use centralized configuration for verification URL
  const verifyUrl = config.getVerificationUrl(verificationToken);
  await sendEmail({
    to: user.email,
    subject: "Verify your account",
    html: `<p>Please verify your account by clicking <a href="${verifyUrl}">here</a>.</p>
           <p>Or visit: <a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>This link will expire in 24 hours.</p>`,
  });

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  return { user: safeUser, accessToken, refreshToken };
}

async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +refreshTokens.token +refreshTokens.expiresAt",
  );

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  // Enforce email verification only when explicitly enabled.
  // This prevents environments without outbound email configured from becoming unusable.
  if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.isVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashedRefresh = await bcrypt.hash(refreshToken, 12);

  const now = Date.now();
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > now);
  user.refreshTokens.push({
    token: hashedRefresh,
    expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  return { user: safeUser, accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(decoded.userId).select(
    "+refreshTokens.token +refreshTokens.expiresAt",
  );
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  // Enforce email verification only when explicitly enabled.
  if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.isVerified) {
    throw new AppError(
      "Please verify your email before refreshing your session",
      403,
    );
  }

  const now = Date.now();
  const tokenRecord = user.refreshTokens.find(
    (rt) =>
      rt.expiresAt &&
      rt.expiresAt.getTime() > now &&
      bcrypt.compareSync(refreshToken, rt.token),
  );

  if (!tokenRecord) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.expiresAt && rt.expiresAt.getTime() > now,
  );
  user.refreshTokens.push({
    token: await bcrypt.hash(newRefreshToken, 12),
    expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
}

async function logoutUser(userId, refreshToken) {
  const user = await User.findById(userId).select(
    "+refreshTokens.token +refreshTokens.expiresAt",
  );
  if (!user) {
    return;
  }

  if (!refreshToken) {
    user.refreshTokens = [];
  } else {
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => !bcrypt.compareSync(refreshToken, rt.token),
    );
  }

  await user.save();
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = config.getPasswordResetUrl(resetToken);
  await sendEmail({
    to: user.email,
    subject: "Password reset instructions",
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  });
}

async function resetPassword(rawToken, newPassword) {
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Token is invalid or has expired", 400);
  }

  // IMPORTANT: Do NOT hash here. The User model has a pre("save") hook that hashes
  // any modified password. Hashing here would cause a double-hash and make login impossible.
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();
}

async function verifyEmail(token) {
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationTokenHash: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  // Check if already verified
  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Mark as verified and clear token fields
  user.isVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
};
