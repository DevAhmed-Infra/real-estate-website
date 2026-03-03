const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

const checkOwnership = (
  Model,
  ownerField = "owner",
  resourceIdParam = "id",
) => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new AppError("Invalid resource ID", 400));
    }

    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    const resourceOwnerId = resource[ownerField];
    const currentUserId = req.user.id;

    if (resourceOwnerId.toString() !== currentUserId.toString()) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    req.resource = resource;
    next();
  });
};

const checkOwnershipOrAdmin = (
  Model,
  ownerField = "owner",
  resourceIdParam = "id",
) => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new AppError("Invalid resource ID", 400));
    }

    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    const resourceOwnerId = resource[ownerField];
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && resourceOwnerId.toString() !== currentUserId.toString()) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    req.resource = resource;
    next();
  });
};

const checkOwnershipOrAgent = (
  Model,
  ownerField = "owner",
  resourceIdParam = "id",
) => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    const resourceOwnerId = resource[ownerField];
    const currentUserId = req.user.id;
    const isAgentOrAdmin = ["agent", "admin"].includes(req.user.role);

    if (
      !isAgentOrAdmin &&
      resourceOwnerId.toString() !== currentUserId.toString()
    ) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    req.resource = resource;
    next();
  });
};

const checkPropertyOwnership = (Model, resourceIdParam = "id") => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new AppError("Invalid resource ID", 400));
    }

    const resource = await Model.findById(resourceId).populate("property");

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    if (!resource.property) {
      return next(new AppError("Property not found", 404));
    }

    const propertyOwnerId = resource.property.owner;
    const currentUserId = req.user.id;

    if (propertyOwnerId.toString() !== currentUserId.toString()) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    req.resource = resource;
    next();
  });
};

const checkBuyerOwnership = (Model, resourceIdParam = "id") => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new AppError("Invalid resource ID", 400));
    }

    const resource = await Model.findById(resourceId);

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    const resourceBuyerId = resource.buyer || resource.user;
    const currentUserId = req.user.id;

    if (!resourceBuyerId) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    if (resourceBuyerId.toString() !== currentUserId.toString()) {
      return next(
        new AppError("You are not authorized to perform this action", 403),
      );
    }

    req.resource = resource;
    next();
  });
};

const preventSelfPropertyAction = (Model, resourceIdParam = "id") => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return next(new AppError("Resource ID is required", 400));
    }

    const resource = await Model.findById(resourceId).populate("property");

    if (!resource) {
      return next(new AppError("Resource not found", 404));
    }

    if (!resource.property) {
      return next(new AppError("Property not found", 404));
    }

    const propertyOwnerId = resource.property.owner;
    const currentUserId = req.user.id;

    if (propertyOwnerId.toString() === currentUserId.toString()) {
      return next(
        new AppError(
          "You cannot perform this action on your own property",
          400,
        ),
      );
    }

    req.resource = resource;
    next();
  });
};

module.exports = {
  checkOwnership,
  checkOwnershipOrAdmin,
  checkOwnershipOrAgent,
  checkPropertyOwnership,
  checkBuyerOwnership,
  preventSelfPropertyAction,
};
