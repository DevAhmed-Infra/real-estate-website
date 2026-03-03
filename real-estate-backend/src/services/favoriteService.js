const Favorite = require("../models/favoriteModel");
const Property = require("../models/propertyModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getAgentPropertyIds(agentId) {
  const props = await Property.find({
    $or: [{ owner: agentId }, { agent: agentId }],
  }).select("_id");
  return props.map((p) => p._id);
}

async function buildFavoriteScopeQuery(user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  if (user.role === "admin") {
    return Favorite.find();
  }

  if (user.role === "buyer") {
    return Favorite.find({ user: user.id });
  }

  if (user.role === "agent") {
    const propertyIds = await getAgentPropertyIds(user.id);
    return Favorite.find({ property: { $in: propertyIds } });
  }

  return Favorite.find({ _id: null });
}

async function getFavorites(query, user) {
  const baseQuery = await buildFavoriteScopeQuery(user);

  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const favorites = await features.query.populate(
    "user property",
    "name email title",
  );

  return favorites;
}

async function getFavoriteById(id, user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  const favorite = await Favorite.findById(id).populate([
    { path: "user", select: "name email" },
    { path: "property", select: "title owner agent" },
  ]);

  if (!favorite) {
    throw new AppError("Favorite not found", 404);
  }

  if (user.role === "admin") {
    return favorite;
  }

  if (user.role === "buyer") {
    if (favorite.user && favorite.user._id.toString() !== user.id.toString()) {
      throw new AppError("You are not authorized to access this favorite", 403);
    }
    return favorite;
  }

  if (user.role === "agent") {
    const p = favorite.property;
    const ownerId = p?.owner?.toString?.();
    const agentId = p?.agent?.toString?.();
    if (ownerId !== user.id.toString() && agentId !== user.id.toString()) {
      throw new AppError("You are not authorized to access this favorite", 403);
    }
    return favorite;
  }

  throw new AppError("You are not authorized to access this favorite", 403);
}

async function addFavorite(propertyId, userId) {
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  if (property.owner.toString() === userId.toString()) {
    throw new AppError("You cannot favorite your own property", 400);
  }

  const existingFavorite = await Favorite.findOne({
    user: userId,
    property: propertyId,
  });

  if (existingFavorite) {
    throw new AppError("Property is already in your favorites", 400);
  }

  const favorite = await Favorite.create({
    user: userId,
    property: propertyId,
  });

  await Property.findByIdAndUpdate(propertyId, {
    $inc: { favoritesCount: 1 },
  });

  return await Favorite.findById(favorite._id).populate(
    "user property",
    "name email title",
  );
}

async function removeFavorite(propertyId, userId) {
  const favorite = await Favorite.findOne({
    user: userId,
    property: propertyId,
  });

  if (!favorite) {
    throw new AppError("Favorite not found", 404);
  }

  await Favorite.findByIdAndUpdate(favorite._id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  await Property.findByIdAndUpdate(propertyId, {
    $inc: { favoritesCount: -1 },
  });
}

async function getUserFavorites(userId) {
  const favorites = await Favorite.find({
    user: userId,
    isDeleted: false,
  })
    .populate("property", "title price images location averageRating")
    .sort("-createdAt");

  return favorites;
}

async function isPropertyFavorited(propertyId, userId) {
  const favorite = await Favorite.findOne({
    user: userId,
    property: propertyId,
    isDeleted: false,
  });

  return !!favorite;
}

async function deleteFavorite(id, userId) {
  const favorite = await Favorite.findById(id);

  if (!favorite) {
    throw new AppError("Favorite not found", 404);
  }

  if (favorite.user.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this favorite", 403);
  }

  const propertyId = favorite.property;

  await Favorite.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  await Property.findByIdAndUpdate(propertyId, {
    $inc: { favoritesCount: -1 },
  });
}

module.exports = {
  getFavorites,
  getFavoriteById,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  isPropertyFavorited,
  deleteFavorite,
};
