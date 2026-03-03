const Review = require("../models/reviewModel");
const Property = require("../models/propertyModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getAgentPropertyIds(agentId) {
  const props = await Property.find({
    $or: [{ owner: agentId }, { agent: agentId }],
  }).select("_id");
  return props.map((p) => p._id);
}

async function buildReviewScopeQuery(user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  if (user.role === "admin") {
    return Review.find();
  }

  if (user.role === "buyer") {
    return Review.find({ user: user.id });
  }

  if (user.role === "agent") {
    const propertyIds = await getAgentPropertyIds(user.id);
    return Review.find({ property: { $in: propertyIds } });
  }

  return Review.find({ _id: null });
}

async function getReviews(query, user) {
  const baseQuery = await buildReviewScopeQuery(user);

  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query.populate(
    "property user",
    "title name email avatar",
  );

  return reviews;
}

async function getReviewById(id, user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  const review = await Review.findById(id).populate([
    { path: "user", select: "name email avatar" },
    { path: "property", select: "title owner agent" },
  ]);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (user.role === "admin") {
    return review;
  }

  if (user.role === "buyer") {
    if (review.user && review.user._id.toString() !== user.id.toString()) {
      throw new AppError("You are not authorized to access this review", 403);
    }
    return review;
  }

  if (user.role === "agent") {
    const p = review.property;
    const ownerId = p?.owner?.toString?.();
    const agentId = p?.agent?.toString?.();
    if (ownerId !== user.id.toString() && agentId !== user.id.toString()) {
      throw new AppError("You are not authorized to access this review", 403);
    }
    return review;
  }

  throw new AppError("You are not authorized to access this review", 403);
}

async function createReview(reviewData, userId) {
  const { property, rating, comment } = reviewData;

  const propertyDoc = await Property.findById(property);
  if (!propertyDoc) {
    throw new AppError("Property not found", 404);
  }

  if (propertyDoc.owner.toString() === userId.toString()) {
    throw new AppError("You cannot review your own property", 400);
  }

  const existingReview = await Review.findOne({
    property,
    user: userId,
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this property", 400);
  }

  const review = await Review.create({
    ...reviewData,
    user: userId,
  });

  await updatePropertyRatings(property);

  return await Review.findById(review._id).populate(
    "property user",
    "title name email avatar",
  );
}

async function updateReview(id, updateData, userId) {
  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.user.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to update this review", 403);
  }

  const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("property user", "title name email avatar");

  await updatePropertyRatings(review.property);

  return updatedReview;
}

async function deleteReview(id, userId) {
  const review = await Review.findById(id);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.user.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this review", 403);
  }

  const propertyId = review.property;

  await Review.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  await updatePropertyRatings(propertyId);
}

async function updatePropertyRatings(propertyId) {
  const stats = await Review.aggregate([
    {
      $match: {
        property: propertyId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$property",
        avgRating: { $avg: "$rating" },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: stats[0].avgRating,
      ratingsCount: stats[0].ratingsCount,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, {
      averageRating: 0,
      ratingsCount: 0,
    });
  }
}

async function getPropertyReviews(propertyId) {
  const reviews = await Review.find({
    property: propertyId,
    isDeleted: false,
  })
    .populate("user", "name email avatar")
    .sort("-createdAt");

  return reviews;
}

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  updatePropertyRatings,
  getPropertyReviews,
};
