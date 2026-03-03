const Analytics = require("../models/analyticsModel");
const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getAnalytics(query) {
  const features = new ApiFeatures(Analytics.find(), query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const analytics = await features.query.populate("userId", "name email");

  return analytics;
}

async function getAnalyticsById(id) {
  const analytics = await Analytics.findById(id).populate(
    "userId",
    "name email",
  );

  if (!analytics) {
    throw new AppError("Analytics record not found", 404);
  }

  return analytics;
}

async function createAnalytics(analyticsData) {
  const analytics = await Analytics.create(analyticsData);

  return await Analytics.findById(analytics._id).populate(
    "userId",
    "name email",
  );
}

async function updateAnalytics(id, updateData) {
  const analytics = await Analytics.findById(id);

  if (!analytics) {
    throw new AppError("Analytics record not found", 404);
  }

  const updatedAnalytics = await Analytics.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("userId", "name email");

  return updatedAnalytics;
}

async function deleteAnalytics(id) {
  const analytics = await Analytics.findById(id);

  if (!analytics) {
    throw new AppError("Analytics record not found", 404);
  }

  await Analytics.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
}

async function trackEvent(
  eventType,
  entityType,
  entityId,
  userId,
  metadata = {},
) {
  const analyticsData = {
    eventType,
    entityType,
    entityId,
    userId,
    metadata,
  };

  if (metadata.location && metadata.location.coordinates) {
    analyticsData.metadata.location = metadata.location;
  } else {
    delete analyticsData.metadata.location;
  }

  const analytics = await Analytics.create(analyticsData);

  return analytics;
}

async function getPropertyAnalytics(propertyId, query) {
  const features = new ApiFeatures(
    Analytics.find({ entityType: "property", entityId: propertyId }),
    query,
  )
    .filter()
    .sort("-createdAt")
    .limitFields()
    .paginate();

  const analytics = await features.query.populate("userId", "name email");

  return analytics;
}

async function getUserAnalytics(userId, query) {
  const features = new ApiFeatures(
    Analytics.find({ entityType: "user", entityId: userId }),
    query,
  )
    .filter()
    .sort("-createdAt")
    .limitFields()
    .paginate();

  const analytics = await features.query.populate("userId", "name email");

  return analytics;
}

async function getEventStats(eventType, startDate, endDate) {
  const matchStage = { eventType };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await Analytics.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          eventType: "$eventType",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  return stats;
}

async function getDashboardStats() {
  const totalProperties = await Property.countDocuments({ isDeleted: false });
  const totalUsers = await User.countDocuments({ isDeleted: false });
  const totalViews = await Analytics.countDocuments({ eventType: "view" });
  const totalFavorites = await Analytics.countDocuments({
    eventType: "favorite",
  });
  const totalOffers = await Analytics.countDocuments({
    eventType: "offer_created",
  });
  const totalBookings = await Analytics.countDocuments({
    eventType: "booking_created",
  });

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const recentViews = await Analytics.countDocuments({
    eventType: "view",
    createdAt: { $gte: last30Days },
  });

  const recentFavorites = await Analytics.countDocuments({
    eventType: "favorite",
    createdAt: { $gte: last30Days },
  });

  const topProperties = await Analytics.aggregate([
    { $match: { eventType: "view", entityType: "property" } },
    {
      $group: {
        _id: "$entityId",
        viewCount: { $sum: 1 },
      },
    },
    { $sort: { viewCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "properties",
        localField: "_id",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: "$property" },
    {
      $project: {
        propertyTitle: "$property.title",
        viewCount: 1,
      },
    },
  ]);

  return {
    overview: {
      totalProperties,
      totalUsers,
      totalViews,
      totalFavorites,
      totalOffers,
      totalBookings,
    },
    recent: {
      views: recentViews,
      favorites: recentFavorites,
    },
    topProperties,
  };
}

module.exports = {
  getAnalytics,
  getAnalyticsById,
  createAnalytics,
  updateAnalytics,
  deleteAnalytics,
  trackEvent,
  getPropertyAnalytics,
  getUserAnalytics,
  getEventStats,
  getDashboardStats,
};
