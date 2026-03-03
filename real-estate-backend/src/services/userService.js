const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Return sanitized user object
  const {
    _id,
    name,
    email,
    role,
    photo,
    phone,
    isVerified,
    isActive,
    averageRating,
    ratingsCount,
    createdAt,
    updatedAt,
  } = user;
  return {
    _id,
    name,
    email,
    role,
    photo,
    phone,
    isVerified,
    isActive,
    averageRating,
    ratingsCount,
    createdAt,
    updatedAt,
  };
}

async function updateMe(userId, payload, file = null) {
  const allowedFields = ["name", "phone", "photo"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updateData[field] = payload[field];
    }
  });

  if (file) {
    updateData.photo = {
      url: `/uploads/${file.filename}`,
      publicId: file.filename,
      format: file.mimetype,
      size: file.size,
      width: undefined,
      height: undefined,
    };
  }

  const updated = await User.findByIdAndUpdate(userId, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new AppError("User not found", 404);
  }

  // Return sanitized updated user
  const {
    _id,
    name,
    email,
    role,
    photo,
    phone,
    isVerified,
    isActive,
    averageRating,
    ratingsCount,
    createdAt,
    updatedAt,
  } = updated;
  return {
    _id,
    name,
    email,
    role,
    photo,
    phone,
    isVerified,
    isActive,
    averageRating,
    ratingsCount,
    createdAt,
    updatedAt,
  };
}

async function changeMyPassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = newPassword; 
  user.passwordChangedAt = new Date();
  user.refreshTokens = [];
  await user.save();
}

async function getUsers(query) {
  const baseQuery = User.find();
  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const users = await features.query;
  return users;
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

async function softDeleteUser(id) {
  const user = await User.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date(), isActive: false },
    { returnDocument: "after" },
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

async function createUser(userData) {
  if (!userData || !userData.email || !userData.name || !userData.password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  const existing = await User.findOne({ email: userData.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use", 400);
  }

  const user = await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    role: userData.role || "buyer",
    phone: userData.phone,
    password: userData.password, 
  });

  return user;
}

async function updateUser(id, updateData) {
  const allowedFields = ["name", "phone", "avatar", "role", "isActive"];
  const filteredData = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      filteredData[field] = updateData[field];
    }
  });

  const user = await User.findByIdAndUpdate(id, filteredData, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

module.exports = {
  getMe,
  updateMe,
  changeMyPassword,
  getUsers,
  getUserById,
  softDeleteUser,
  createUser,
  updateUser,
};
