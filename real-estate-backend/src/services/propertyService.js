const Property = require("../models/propertyModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getProperties(query) {
  const features = new ApiFeatures(Property.find(), query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const properties = await features.query.populate(
    "owner agent",
    "name email avatar",
  );

  return properties;
}

async function getPropertyById(id) {
  const property = await Property.findById(id).populate(
    "owner agent",
    "name email avatar",
  );

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  return property;
}

async function createProperty(propertyData, userId) {
  const property = await Property.create({
    ...propertyData,
    owner: userId,
  });

  return await Property.findById(property._id).populate(
    "owner agent",
    "name email avatar",
  );
}

async function updateProperty(id, updateData, userId) {
  const property = await Property.findById(id);

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  if (property.owner.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to update this property", 403);
  }

  const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("owner agent", "name email avatar");

  return updatedProperty;
}

async function deleteProperty(id, userId) {
  const property = await Property.findById(id);

  if (!property) {
    throw new AppError("Property not found", 404);
  }

  if (property.owner.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this property", 403);
  }

  await Property.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
}

async function getPropertyStats() {
  const stats = await Property.aggregate([
    {
      // Ensure soft-deleted properties are excluded from aggregations.
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);

  return stats;
}

async function incrementViews(id) {
  await Property.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
}

/**
 * Update property images array
 * Used by photo upload controllers
 */
async function updatePropertyImages(id, images) {
  const updatedProperty = await Property.findByIdAndUpdate(
    id,
    { images },
    { returnDocument: "after", runValidators: true },
  ).populate("owner agent", "name email avatar");

  if (!updatedProperty) {
    throw new AppError("Property not found", 404);
  }

  return updatedProperty;
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  incrementViews,
  updatePropertyImages,
};
