const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getNotifications(query, user) {
  // SECURITY: enforce scoping server-side to prevent notification leakage.
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  const baseQuery =
    user.role === "admin"
      ? Notification.find()
      : Notification.find({ recipient: user.id });

  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const notifications = await features.query.populate(
    "recipient",
    "name email avatar",
  );

  return notifications;
}

async function getNotificationById(id, userId) {
  const notification = await Notification.findById(id).populate(
    "recipient",
    "name email avatar",
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (userId && notification.recipient && notification.recipient._id) {
    if (notification.recipient._id.toString() !== userId.toString()) {
      throw new AppError(
        "You are not authorized to access this notification",
        403,
      );
    }
  }

  return notification;
}

async function createNotification(notificationData) {
  const notification = await Notification.create(notificationData);

  return await Notification.findById(notification._id).populate(
    "recipient",
    "name email avatar",
  );
}

async function updateNotification(id, updateData, userId) {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.recipient.toString() !== userId.toString()) {
    throw new AppError(
      "You are not authorized to update this notification",
      403,
    );
  }

  const updatedNotification = await Notification.findByIdAndUpdate(
    id,
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("recipient", "name email avatar");

  return updatedNotification;
}

async function deleteNotification(id, userId) {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.recipient.toString() !== userId.toString()) {
    throw new AppError(
      "You are not authorized to delete this notification",
      403,
    );
  }

  await Notification.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
}

async function getUserNotifications(userId, query) {
  const features = new ApiFeatures(
    Notification.find({ recipient: userId }),
    query,
  )
    .filter()
    .sort("-createdAt")
    .limitFields()
    .paginate();

  const notifications = await features.query;

  return notifications;
}

async function markAsRead(id, userId) {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.recipient.toString() !== userId.toString()) {
    throw new AppError(
      "You are not authorized to update this notification",
      403,
    );
  }

  const updatedNotification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { returnDocument: "after" },
  ).populate("recipient", "name email avatar");

  return updatedNotification;
}

async function markAllAsRead(userId) {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true },
  );

  return {
    message: "All notifications marked as read",
  };
}

async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false,
  });

  return { unreadCount: count };
}

async function createNotificationForUser(
  recipientId,
  type,
  title,
  message,
  relatedEntity = null,
) {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedEntity,
  });

  return await Notification.findById(notification._id).populate(
    "recipient",
    "name email avatar",
  );
}

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
  createNotificationForUser,
};
