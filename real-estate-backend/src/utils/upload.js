const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("./appError");



const uploadDir = path.join(__dirname, "..", "dev-data", "uploads");
const tempDir = path.join(__dirname, "..", "dev-data", "temp");

[uploadDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed", 400), false);
  }
};


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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


const processImage = async (filePath, options = {}) => {
  const { width = 1200, height = 800, quality = 85, format = "jpeg" } = options;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

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


const getDefaultProfilePhoto = () => ({
  url: "uploads/default-profile.jpg",
  publicId: "default-profile",
  format: "jpg",
  size: 0,
  width: 200,
  height: 200,
  uploadedAt: new Date(),
});


const uploadUserPhoto = async (userId, file) => {
  if (!file) throw new AppError("No file uploaded", 400);

  try {
    const { buffer, metadata } = await processImage(file.path, {
      width: 400,
      height: 400,
      quality: 85,
    });

    const filename = `profile-${userId}-${Date.now()}.jpg`;

    const imageData = await saveImage(buffer, filename, "profiles");

    return {
      ...imageData,
      width: metadata.width,
      height: metadata.height,
    };
  } finally {
    await cleanupTempFiles(file);
  }
};


const processPropertyImages = async (propertyId, files, captions = []) => {
  if (!files || files.length === 0)
    throw new AppError("No files uploaded", 400);
  if (files.length > 10) throw new AppError("Maximum 10 images allowed", 400);

  try {
    const processedImages = await Promise.all(
      files.map(async (file, index) => {
        const { buffer, metadata } = await processImage(file.path, {
          width: 1200,
          height: 800,
          quality: 85,
        });

        const filename = `property-${propertyId}-${Date.now()}-${index}.jpg`;

        const imageData = await saveImage(buffer, filename, "properties");

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


const deleteImage = async (publicId) => {
  if (!publicId || publicId === "default-profile") return;

  try {
    const filePath = path.join(uploadDir, publicId);
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete image: ${publicId}`);
  }
};

module.exports = {
  uploadProfilePhoto,
  uploadPropertyImages,
  upload, 

  uploadUserPhoto,
  processPropertyImages,
  deleteImage,
  getDefaultProfilePhoto,

  processImage,
  saveImage,
  cleanupTempFiles,

  uploadDir,
  tempDir,
};
