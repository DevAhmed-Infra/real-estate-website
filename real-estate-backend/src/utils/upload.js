const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("./appError");

/**
 * Centralized Photo Upload Utility
 * Handles all image operations for users and properties
 * Production-ready with optimization and security
 */

// Upload directories
const uploadDir = path.join(__dirname, "..", "dev-data", "uploads");
const tempDir = path.join(__dirname, "..", "dev-data", "temp");

// Ensure directories exist
[uploadDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

// File filter for security - only allow specific image types
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed", 400), false);
  }
};

/**
 * Multer configurations for different use cases
 */
const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for profile photos
}).single("photo");

const uploadPropertyImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per image, max 10 files
}).array("images", 10);

// Legacy upload for backward compatibility
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Process and optimize image
 * Removes EXIF data, resizes, and compresses for web
 */
const processImage = async (filePath, options = {}) => {
  const { width = 1200, height = 800, quality = 85, format = "jpeg" } = options;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Process image: resize, compress, remove EXIF
    const optimizedBuffer = await image
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const finalMetadata = await sharp(optimizedBuffer).metadata();

    return {
      buffer: optimizedBuffer,
      metadata: {
        width: finalMetadata.width,
        height: finalMetadata.height,
        format: finalMetadata.format,
        size: optimizedBuffer.length,
      },
    };
  } catch (error) {
    throw new AppError(`Image processing failed: ${error.message}`, 500);
  }
};

/**
 * Save processed image to storage directory
 */
const saveImage = async (buffer, filename, subfolder = "") => {
  const targetDir = path.join(uploadDir, subfolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  return {
    url: path.join("uploads", subfolder, filename).replace(/\\/g, "/"),
    publicId: filename,
    format: path.extname(filename).slice(1),
    size: buffer.length,
    uploadedAt: new Date(),
  };
};

/**
 * Cleanup temporary files after processing
 */
const cleanupTempFiles = async (files) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];

  await Promise.all(
    fileArray.map(async (file) => {
      if (file && file.path) {
        try {
          await fs.promises.unlink(file.path);
        } catch (error) {
          console.warn(`Failed to cleanup temp file: ${file.path}`);
        }
      }
    }),
  );
};

/**
 * Get default profile photo for users without uploaded photos
 */
const getDefaultProfilePhoto = () => ({
  url: "uploads/default-profile.jpg",
  publicId: "default-profile",
  format: "jpg",
  size: 0,
  width: 200,
  height: 200,
  uploadedAt: new Date(),
});

/**
 * Upload and process user profile photo
 * Creates optimized square image for profile
 */
const uploadUserPhoto = async (userId, file) => {
  if (!file) throw new AppError("No file uploaded", 400);

  try {
    // Process image for profile (square, optimized)
    const { buffer, metadata } = await processImage(file.path, {
      width: 400,
      height: 400,
      quality: 85,
    });

    // Generate unique filename
    const filename = `profile-${userId}-${Date.now()}.jpg`;

    // Save image
    const imageData = await saveImage(buffer, filename, "profiles");

    // Return complete photo object with metadata
    return {
      ...imageData,
      width: metadata.width,
      height: metadata.height,
    };
  } finally {
    await cleanupTempFiles(file);
  }
};

/**
 * Upload and process property images
 * Creates optimized images for property listings
 */
const processPropertyImages = async (propertyId, files, captions = []) => {
  if (!files || files.length === 0)
    throw new AppError("No files uploaded", 400);
  if (files.length > 10) throw new AppError("Maximum 10 images allowed", 400);

  try {
    const processedImages = await Promise.all(
      files.map(async (file, index) => {
        // Process image for property (larger, high quality)
        const { buffer, metadata } = await processImage(file.path, {
          width: 1200,
          height: 800,
          quality: 85,
        });

        // Generate unique filename
        const filename = `property-${propertyId}-${Date.now()}-${index}.jpg`;

        // Save image
        const imageData = await saveImage(buffer, filename, "properties");

        // Return complete image object
        return {
          ...imageData,
          width: metadata.width,
          height: metadata.height,
          caption: captions[index] || "",
          isPrimary: false,
        };
      }),
    );

    return processedImages;
  } finally {
    await cleanupTempFiles(files);
  }
};

/**
 * Delete image from storage
 */
const deleteImage = async (publicId) => {
  if (!publicId || publicId === "default-profile") return;

  try {
    // Extract path from publicId
    const filePath = path.join(uploadDir, publicId);
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete image: ${publicId}`);
  }
};

module.exports = {
  // Multer configurations for routes
  uploadProfilePhoto,
  uploadPropertyImages,
  upload, // Legacy support

  // Core processing functions
  uploadUserPhoto,
  processPropertyImages,
  deleteImage,
  getDefaultProfilePhoto,

  // Utility functions
  processImage,
  saveImage,
  cleanupTempFiles,

  // Constants
  uploadDir,
  tempDir,
};
