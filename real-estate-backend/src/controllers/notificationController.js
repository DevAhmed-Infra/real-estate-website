const asyncHandler = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getNotifications(
    req.query,
    req.user,
  );

  res.status(200).json({
    success: true,
    status: "success",
    results: notifications.length,
    data: {
      notifications,
    },
  });
});

const getNotificationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const notification = await notificationService.getNotificationById(
    id,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      notification,
    },
  });
});

const createNotification = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.createNotification(req.body);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      notification,
    },
  });
});

const updateNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const notification = await notificationService.updateNotification(
    id,
    req.body,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      notification,
    },
  });
});

const deleteNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await notificationService.deleteNotification(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const getUserNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getUserNotifications(
    req.user.id,
    req.query,
  );

  res.status(200).json({
    success: true,
    status: "success",
    results: notifications.length,
    data: {
      notifications,
    },
  });
});

const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      notification,
    },
  });
});

const markAllAsRead = asyncHandler(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: result,
  });
});

const getUnreadCount = asyncHandler(async (req, res, next) => {
  const result = await notificationService.getUnreadCount(req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: result,
  });
});

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
