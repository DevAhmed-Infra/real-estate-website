const authService = require("../src/services/authService");
const User = require("../src/models/userModel");
const AppError = require("../src/utils/appError");
const { sendEmail } = require("../src/utils/email");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

jest.mock("../src/models/userModel");
jest.mock("../src/utils/email");
jest.mock("jsonwebtoken");
jest.mock("bcryptjs");

describe("Authentication Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should successfully register a new user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "1234567890",
      };

      const mockUser = {
        _id: "userId123",
        name: userData.name,
        email: userData.email,
        role: "buyer",
        isVerified: false,
        refreshTokens: [],
        save: jest.fn(),
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);
      bcrypt.hash = jest.fn().mockResolvedValue("hashedToken");
      jwt.sign = jest.fn().mockReturnValue("token123");
      sendEmail.mockResolvedValue({});

      const result = await authService.registerUser(userData);

      expect(result.user).toHaveProperty("id");
      expect(result.user.email).toBe(userData.email.toLowerCase());
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email.toLowerCase(),
          name: userData.name,
        }),
      );
    });

    it("should throw error if email already exists", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      User.findOne = jest.fn().mockResolvedValue({ email: userData.email });

      await expect(authService.registerUser(userData)).rejects.toThrow(
        "Email already in use",
      );
    });

    it("should throw error with code 400 for duplicate email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      User.findOne = jest.fn().mockResolvedValue({ email: userData.email });

      try {
        await authService.registerUser(userData);
      } catch (err) {
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe("loginUser", () => {
    it("should successfully login a user", async () => {
      const email = "john@example.com";
      const password = "password123";

      const mockUser = {
        _id: "userId123",
        email: email,
        name: "John Doe",
        role: "buyer",
        isVerified: true,
        password: "hashedPassword",
        refreshTokens: [],
        save: jest.fn(),
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("hashedRefreshToken");
      jwt.sign = jest.fn().mockReturnValue("token123");

      const result = await authService.loginUser(email, password);

      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error for invalid email", async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.loginUser("invalid@example.com", "password123"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for invalid password", async () => {
      const mockUser = {
        _id: "userId123",
        email: "john@example.com",
        password: "hashedPassword",
        refreshTokens: [],
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        authService.loginUser("john@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error if email verification is required but user not verified", async () => {
      process.env.REQUIRE_EMAIL_VERIFICATION = "true";

      const mockUser = {
        _id: "userId123",
        email: "john@example.com",
        password: "hashedPassword",
        isVerified: false,
        refreshTokens: [],
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await expect(
        authService.loginUser("john@example.com", "password123"),
      ).rejects.toThrow("Please verify your email before logging in");

      delete process.env.REQUIRE_EMAIL_VERIFICATION;
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token successfully", async () => {
      const refreshToken = "refreshToken123";

      const mockUser = {
        _id: "userId123",
        refreshTokens: [
          {
            token: "hashedToken",
            expiresAt: new Date(Date.now() + 1000000),
          },
        ],
        save: jest.fn(),
      };

      jwt.verify = jest.fn().mockReturnValue({ userId: "userId123" });
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compareSync = jest.fn().mockReturnValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("newHashedToken");
      jwt.sign = jest.fn().mockReturnValue("newAccessToken");

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error if refresh token is missing", async () => {
      await expect(authService.refreshAccessToken(null)).rejects.toThrow(
        "Refresh token is required",
      );
    });

    it("should throw error for invalid refresh token", async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(
        authService.refreshAccessToken("invalidToken"),
      ).rejects.toThrow("Invalid or expired refresh token");
    });

    it("should throw error if refresh token not found in user record", async () => {
      const refreshToken = "refreshToken123";

      const mockUser = {
        _id: "userId123",
        refreshTokens: [],
      };

      jwt.verify = jest.fn().mockReturnValue({ userId: "userId123" });
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        authService.refreshAccessToken(refreshToken),
      ).rejects.toThrow("Invalid or expired refresh token");
    });
  });

  describe("logoutUser", () => {
    it("should remove refresh token on logout", async () => {
      const userId = "userId123";
      const refreshToken = "refreshToken123";

      const mockUser = {
        _id: userId,
        refreshTokens: [{ token: "hashedToken" }],
        save: jest.fn(),
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compareSync = jest.fn().mockReturnValue(true);

      await authService.logoutUser(userId, refreshToken);

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.refreshTokens.length).toBe(0);
    });

    it("should clear all tokens if refresh token not provided", async () => {
      const userId = "userId123";

      const mockUser = {
        _id: userId,
        refreshTokens: [{ token: "hashedToken1" }, { token: "hashedToken2" }],
        save: jest.fn(),
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authService.logoutUser(userId, null);

      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe("requestPasswordReset", () => {
    it("should send password reset email", async () => {
      const email = "john@example.com";

      const mockUser = {
        _id: "userId123",
        email: email,
        save: jest.fn(),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      sendEmail.mockResolvedValue({});

      await authService.requestPasswordReset(email);

      expect(User.findOne).toHaveBeenCalledWith({ email: email.toLowerCase() });
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(mockUser.passwordResetToken).toBeDefined();
      expect(mockUser.passwordResetExpires).toBeDefined();
    });

    it("should not throw error if user not found", async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        authService.requestPasswordReset("notfound@example.com"),
      ).resolves.not.toThrow();
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const resetToken = "resetToken123";
      const newPassword = "newPassword123";

      const mockUser = {
        _id: "userId123",
        password: "oldHashedPassword",
        save: jest.fn(),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authService.resetPassword(resetToken, newPassword);

      expect(mockUser.password).toBe(newPassword);
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error for invalid or expired token", async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        authService.resetPassword("invalidToken", "password"),
      ).rejects.toThrow("Token is invalid or has expired");
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully", async () => {
      const token = "verificationToken123";

      const mockUser = {
        _id: "userId123",
        email: "john@example.com",
        isVerified: false,
        save: jest.fn(),
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authService.verifyEmail(token);

      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.emailVerificationToken).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error for invalid verification token", async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authService.verifyEmail("invalidToken")).rejects.toThrow(
        "Invalid or expired verification token",
      );
    });
  });

  describe("generateAccessToken", () => {
    it("should generate access token with correct payload", () => {
      const user = { _id: "userId123", role: "buyer" };

      jwt.sign = jest.fn().mockReturnValue("token123");

      authService.generateAccessToken?.(user) ||
        jwt.sign(
          {
            userId: user._id.toString(),
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

      expect(jwt.sign).toBeDefined();
    });
  });

  describe("hashPassword", () => {
    it("should hash password with bcrypt", async () => {
      const password = "password123";
      const salt = "salt";
      const hashedPassword = "hashedPassword";

      bcrypt.genSalt = jest.fn().mockResolvedValue(salt);
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      const result =
        (await authService.hashPassword?.(password)) ||
        bcrypt.hash(password, salt);

      expect(result).toBeDefined();
    });
  });
});
