const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");
const {
  uploadUserPhoto,
  deleteImage,
  getDefaultProfilePhoto,
} = require("../utils/upload");

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user,
    },
  });
});

const updateMe = asyncHandler(async (req, res) => {
  if (req.file) {
    const profilePhoto = await uploadUserPhoto(req.user.id, req.file);

    const updated = await userService.updateMe(req.user.id, { profilePhoto });

    return res.status(200).json({
      success: true,
      status: "success",
      data: {
        user: updated,
      },
    });
  }

  const updated = await userService.updateMe(req.user.id, req.body);
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user: updated,
    },
  });
});


const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      status: "error",
      message: "No file uploaded",
    });
  }

  const profilePhoto = await uploadUserPhoto(req.user.id, req.file);

  const updatedUser = await userService.updateMe(req.user.id, { profilePhoto });

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});


const deleteProfilePhoto = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.id);

  if (user.profilePhoto && user.profilePhoto.publicId !== "default-profile") {
    await deleteImage(user.profilePhoto.publicId);
  }

  const defaultPhoto = getDefaultProfilePhoto();
  const updatedUser = await userService.updateMe(req.user.id, {
    profilePhoto: defaultPhoto,
  });

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changeMyPassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      message: "Password updated successfully",
    },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers(req.query);
  res.status(200).json({
    success: true,
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.params.id);
  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const deleteMe = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.user.id);
  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({
    success: true,
    status: "success",
    data: {
      user,
    },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      user,
    },
  });
});

module.exports = {
  deleteUser,
  deleteMe,
  createUser,
  updateUser,
  getUser,
  getUsers,
  updateMe,
  changeMyPassword,
  getMe,
  uploadProfilePhoto,
  deleteProfilePhoto,
};
