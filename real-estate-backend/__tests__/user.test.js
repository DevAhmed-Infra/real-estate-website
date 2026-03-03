const userService = require("../src/services/userService");
const User = require("../src/models/userModel");
const AppError = require("../src/utils/appError");
const bcrypt = require("bcryptjs");

jest.mock("../src/models/userModel");
jest.mock("bcryptjs");

describe("User Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMe", () => {
    it("should get user profile successfully", async () => {
      const userId = "userId123";
      const mockUser = {
        _id: userId,
        name: "John Doe",
        email: "john@example.com",
        role: "buyer",
        photo: "photo.jpg",
        phone: "1234567890",
        isVerified: true,
        isActive: true,
        averageRating: 4.5,
        ratingsCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await userService.getMe(userId);

      expect(result).toHaveProperty("_id");
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it("should throw error if user not found", async () => {
      User.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(userService.getMe("userId123")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("updateMe", () => {
    it("should update user profile", async () => {
      const userId = "userId123";
      const updateData = { name: "Jane Doe", phone: "9876543210" };

      const mockUpdatedUser = {
        _id: userId,
        ...updateData,
        email: "john@example.com",
        role: "buyer",
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await userService.updateMe(userId, updateData);

      expect(result.name).toBe("Jane Doe");
      expect(result.phone).toBe("9876543210");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.any(Object),
        {
          returnDocument: "after",
          runValidators: true,
        },
      );
    });

    it("should handle file upload for profile photo", async () => {
      const userId = "userId123";
      const updateData = {};
      const file = {
        filename: "photo.jpg",
        mimetype: "image/jpeg",
        size: 5000,
      };

      const mockUpdatedUser = {
        _id: userId,
        email: "john@example.com",
        photo: {
          url: `/uploads/${file.filename}`,
          publicId: file.filename,
          format: file.mimetype,
          size: file.size,
        },
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await userService.updateMe(userId, updateData, file);

      expect(result.photo).toBeDefined();
      expect(result.photo.url).toContain("uploads");
    });

    it("should throw error if user not found", async () => {
      User.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        userService.updateMe("userId123", { name: "Jane" }),
      ).rejects.toThrow("User not found");
    });
  });

  describe("changeMyPassword", () => {
    it("should change password successfully", async () => {
      const userId = "userId123";
      const currentPassword = "oldPassword123";
      const newPassword = "newPassword123";

      const mockUser = {
        _id: userId,
        password: "hashedOldPassword",
        passwordChangedAt: new Date(),
        refreshTokens: [],
        save: jest.fn(),
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await userService.changeMyPassword(userId, currentPassword, newPassword);

      expect(mockUser.password).toBe(newPassword);
      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw error if current password is incorrect", async () => {
      const mockUser = {
        _id: "userId123",
        password: "hashedPassword",
      };

      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        userService.changeMyPassword(
          "userId123",
          "wrongPassword",
          "newPassword",
        ),
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw error if user not found", async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        userService.changeMyPassword("userId123", "password", "newPassword"),
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUsers", () => {
    it("should get list of users", async () => {
      const mockUsers = [
        { _id: "user1", name: "User 1", email: "user1@example.com" },
        { _id: "user2", name: "User 2", email: "user2@example.com" },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        // Make it thenable so it can be awaited
        then: jest.fn((resolve) => {
          setTimeout(() => resolve(mockUsers), 0);
        }),
      };

      User.find = jest.fn().mockReturnValue(mockQuery);

      const result = await userService.getUsers({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getUserById", () => {
    it("should get user by ID", async () => {
      const userId = "userId123";
      const mockUser = {
        _id: userId,
        name: "John Doe",
        email: "john@example.com",
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).toBeDefined();
      expect(result._id).toBe(userId);
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it("should throw error if user not found", async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.getUserById("notfound123")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("softDeleteUser", () => {
    it("should soft delete user", async () => {
      const userId = "userId123";
      const mockDeletedUser = {
        _id: userId,
        name: "John Doe",
        isDeleted: true,
        isActive: false,
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDeletedUser);

      const result = await userService.softDeleteUser(userId);

      expect(result.isDeleted).toBe(true);
      expect(result.isActive).toBe(false);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          isDeleted: true,
          isActive: false,
        }),
        { returnDocument: "after" },
      );
    });

    it("should throw error if user not found", async () => {
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(userService.softDeleteUser("notfound123")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("createUser", () => {
    it("should create new user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "1234567890",
      };

      const mockCreatedUser = {
        _id: "userId123",
        ...userData,
        role: "buyer",
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(userData);

      expect(result._id).toBeDefined();
      expect(result.email).toBe(userData.email.toLowerCase());
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email.toLowerCase(),
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

      await expect(userService.createUser(userData)).rejects.toThrow(
        "Email already in use",
      );
    });

    it("should throw error if required fields are missing", async () => {
      await expect(userService.createUser({})).rejects.toThrow(
        "Name, email, and password are required",
      );
      await expect(userService.createUser({ name: "John" })).rejects.toThrow(
        "Name, email, and password are required",
      );
    });
  });

  describe("updateUser", () => {
    it("should update user by ID", async () => {
      const userId = "userId123";
      const updateData = { name: "Jane Doe", phone: "9876543210" };

      const mockUpdatedUser = {
        _id: userId,
        ...updateData,
        email: "john@example.com",
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(result.name).toBe("Jane Doe");
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.any(Object),
        {
          returnDocument: "after",
          runValidators: true,
        },
      );
    });

    it("should throw error if user not found", async () => {
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        userService.updateUser("notfound123", { name: "Jane" }),
      ).rejects.toThrow("User not found");
    });

    it("should only allow whitelisted fields", async () => {
      const userId = "userId123";
      const updateData = {
        name: "Jane",
        password: "hacked", 
        email: "hacked@example.com", 
      };

      const mockUpdatedUser = {
        _id: userId,
        name: "Jane",
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      await userService.updateUser(userId, updateData);

      const callArgs = User.findByIdAndUpdate.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty("password");
      expect(callArgs).not.toHaveProperty("email");
    });
  });
});
