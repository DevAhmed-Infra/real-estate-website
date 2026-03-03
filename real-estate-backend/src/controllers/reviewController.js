const asyncHandler = require("../utils/asyncHandler");
const reviewService = require("../services/reviewService");

const getReviews = asyncHandler(async (req, res, next) => {
  const reviews = await reviewService.getReviews(req.query, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

const getReviewById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const review = await reviewService.getReviewById(id, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      review,
    },
  });
});

const createReview = asyncHandler(async (req, res, next) => {
  const review = await reviewService.createReview(req.body, req.user.id);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      review,
    },
  });
});

const updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const review = await reviewService.updateReview(id, req.body, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      review,
    },
  });
});

const deleteReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await reviewService.deleteReview(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const getPropertyReviews = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  const reviews = await reviewService.getPropertyReviews(propertyId);

  res.status(200).json({
    success: true,
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getPropertyReviews,
};
