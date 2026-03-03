const asyncHandler = require("../utils/asyncHandler");
const propertyService = require("../services/propertyService");
const { processPropertyImages, deleteImage } = require("../utils/upload");

const getProperties = asyncHandler(async (req, res, next) => {
  const properties = await propertyService.getProperties(req.query);

  res.status(200).json({
    success: true,
    status: "success",
    results: properties.length,
    data: {
      properties,
    },
  });
});

const getPropertyById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const property = await propertyService.getPropertyById(id);

  await propertyService.incrementViews(id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      property,
    },
  });
});

const createProperty = asyncHandler(async (req, res, next) => {
  const property = await propertyService.createProperty(req.body, req.user.id);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      property,
    },
  });
});

const updateProperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const property = await propertyService.updateProperty(
    id,
    req.body,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      property,
    },
  });
});

const deleteProperty = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await propertyService.deleteProperty(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const getPropertyStats = asyncHandler(async (req, res, next) => {
  const stats = await propertyService.getPropertyStats();

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      stats,
    },
  });
});

/**
 * Upload multiple property images
 * Optimizes images and updates property document
 */
const uploadPropertyImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      status: "error",
      message: "No files uploaded",
    });
  }

  const { captions } = req.body;
  const captionsArray = captions
    ? Array.isArray(captions)
      ? captions
      : [captions]
    : [];

  try {
    // Process images using centralized utility
    const processedImages = await processPropertyImages(
      req.params.id,
      req.files,
      captionsArray,
    );

    // Get property and update with new images
    const property = await propertyService.getPropertyById(req.params.id);

    // Check ownership
    if (property.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        status: "error",
        message: "You are not authorized to upload images for this property",
      });
    }

    // Check current image count
    const currentImageCount = property.images ? property.images.length : 0;
    const totalImages = currentImageCount + processedImages.length;

    if (totalImages > 10) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: `Cannot upload ${processedImages.length} images. Maximum 10 images allowed. Currently have ${currentImageCount} images.`,
      });
    }

    // Add new images to property
    const updatedImages = [...(property.images || []), ...processedImages];

    // Set first image as primary if no primary exists
    if (
      updatedImages.length > 0 &&
      !updatedImages.some((img) => img.isPrimary)
    ) {
      updatedImages[0].isPrimary = true;
    }

    // Update property with new images
    const updatedProperty = await propertyService.updatePropertyImages(
      req.params.id,
      updatedImages,
    );

    res.status(201).json({
      success: true,
      status: "success",
      data: {
        images: updatedProperty.images,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a specific property image
 */
const deletePropertyImage = asyncHandler(async (req, res, next) => {
  const { imageIndex } = req.params;

  try {
    const property = await propertyService.getPropertyById(req.params.id);

    // Check ownership
    if (property.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        status: "error",
        message: "You are not authorized to delete images for this property",
      });
    }

    if (!property.images || property.images.length === 0) {
      return res.status(404).json({
        success: false,
        status: "error",
        message: "No images found for this property",
      });
    }

    const index = parseInt(imageIndex);
    if (index < 0 || index >= property.images.length) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Invalid image index",
      });
    }

    const imageToDelete = property.images[index];

    // Delete from storage
    if (imageToDelete.publicId) {
      await deleteImage(imageToDelete.publicId);
    }

    // Remove from array
    property.images.splice(index, 1);

    // If deleted image was primary, set first remaining image as primary
    if (imageToDelete.isPrimary && property.images.length > 0) {
      property.images[0].isPrimary = true;
    }

    // Update property
    const updatedProperty = await propertyService.updatePropertyImages(
      req.params.id,
      property.images,
    );

    res.status(200).json({
      success: true,
      status: "success",
      data: {
        images: updatedProperty.images,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Set an image as the cover/primary image
 */
const setCoverImage = asyncHandler(async (req, res, next) => {
  const { imageIndex } = req.params;

  try {
    const property = await propertyService.getPropertyById(req.params.id);

    // Check ownership
    if (property.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        status: "error",
        message: "You are not authorized to modify images for this property",
      });
    }

    if (!property.images || property.images.length === 0) {
      return res.status(404).json({
        success: false,
        status: "error",
        message: "No images found for this property",
      });
    }

    const index = parseInt(imageIndex);
    if (index < 0 || index >= property.images.length) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Invalid image index",
      });
    }

    // Reset all images to non-primary
    property.images.forEach((image, i) => {
      image.isPrimary = i === index;
    });

    // Update property
    const updatedProperty = await propertyService.updatePropertyImages(
      req.params.id,
      property.images,
    );

    res.status(200).json({
      success: true,
      status: "success",
      data: {
        images: updatedProperty.images,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  uploadPropertyImages,
  deletePropertyImage,
  setCoverImage,
};
