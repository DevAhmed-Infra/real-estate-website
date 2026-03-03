const asyncHandler = require("../utils/asyncHandler");
const analyticsService = require("../services/analyticsService");

const getAnalytics = asyncHandler(async (req, res, next) => {
  const analytics = await analyticsService.getAnalytics(req.query);

  res.status(200).json({
    success: true,
    status: "success",
    results: analytics.length,
    data: {
      analytics,
    },
  });
});

const getAnalyticsById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const analytics = await analyticsService.getAnalyticsById(id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      analytics,
    },
  });
});

const createAnalytics = asyncHandler(async (req, res, next) => {
  const analytics = await analyticsService.createAnalytics(req.body);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      analytics,
    },
  });
});

const updateAnalytics = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const analytics = await analyticsService.updateAnalytics(id, req.body);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      analytics,
    },
  });
});

const deleteAnalytics = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await analyticsService.deleteAnalytics(id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const trackEvent = asyncHandler(async (req, res, next) => {
  const { eventType, entityType, entityId, metadata } = req.body;

  const analytics = await analyticsService.trackEvent(
    eventType,
    entityType,
    entityId,
    req.user?.id || null,
    metadata,
  );

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      analytics,
    },
  });
});

const getPropertyAnalytics = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  const analytics = await analyticsService.getPropertyAnalytics(
    propertyId,
    req.query,
  );

  res.status(200).json({
    success: true,
    status: "success",
    results: analytics.length,
    data: {
      analytics,
    },
  });
});

const getUserAnalytics = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const analytics = await analyticsService.getUserAnalytics(userId, req.query);

  res.status(200).json({
    success: true,
    status: "success",
    results: analytics.length,
    data: {
      analytics,
    },
  });
});

const getEventStats = asyncHandler(async (req, res, next) => {
  const { eventType, startDate, endDate } = req.query;

  const stats = await analyticsService.getEventStats(
    eventType,
    startDate,
    endDate,
  );

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      stats,
    },
  });
});

const getDashboardStats = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getDashboardStats();

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      stats,
    },
  });
});

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
