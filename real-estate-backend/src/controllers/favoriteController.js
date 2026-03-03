const asyncHandler = require("../utils/asyncHandler");
const favoriteService = require("../services/favoriteService");

const getFavorites = asyncHandler(async (req, res, next) => {
  const favorites = await favoriteService.getFavorites(req.query, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    results: favorites.length,
    data: {
      favorites,
    },
  });
});

const getFavoriteById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const favorite = await favoriteService.getFavoriteById(id, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      favorite,
    },
  });
});

const addFavorite = asyncHandler(async (req, res, next) => {
  const { property } = req.body;

  const favorite = await favoriteService.addFavorite(property, req.user.id);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      favorite,
    },
  });
});

const removeFavorite = asyncHandler(async (req, res, next) => {
  const { property } = req.params;

  await favoriteService.removeFavorite(property, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const getUserFavorites = asyncHandler(async (req, res, next) => {
  const favorites = await favoriteService.getUserFavorites(req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    results: favorites.length,
    data: {
      favorites,
    },
  });
});

const checkFavoriteStatus = asyncHandler(async (req, res, next) => {
  const { property } = req.params;

  const isFavorited = await favoriteService.isPropertyFavorited(
    property,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      isFavorited,
    },
  });
});

const deleteFavorite = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await favoriteService.deleteFavorite(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

module.exports = {
  getFavorites,
  getFavoriteById,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavoriteStatus,
  deleteFavorite,
};
