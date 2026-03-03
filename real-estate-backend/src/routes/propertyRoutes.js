const express = require("express");
const propertyController = require("../controllers/propertyController");
const { protect } = require("../middlewares/authMiddleware");
const { restrictTo } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validationMiddleware");
const { checkOwnership } = require("../middlewares/ownershipMiddleware");
const { uploadPropertyImages } = require("../utils/upload");
const {
  propertySchema,
  propertyUpdateSchema,
  paginationSchema,
  propertyFilterSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.get(
  "/",
  validate(paginationSchema),
  validate(propertyFilterSchema, "query"),
  propertyController.getProperties,
);
router.get("/stats/overview", propertyController.getPropertyStats);
router.get("/:id", propertyController.getPropertyById);

router.use(protect);

router.post(
  "/",
  restrictTo("agent", "admin"),
  validate(propertySchema),
  propertyController.createProperty,
);

router.patch(
  "/:id",
  validate(propertyUpdateSchema),
  checkOwnership(require("../models/propertyModel"), "owner", "id"),
  propertyController.updateProperty,
);

router.delete(
  "/:id",
  checkOwnership(require("../models/propertyModel"), "owner", "id"),
  propertyController.deleteProperty,
);

router.post(
  "/:id/images",
  protect,
  uploadPropertyImages,
  propertyController.uploadPropertyImages,
);

router.delete(
  "/:id/images/:imageIndex",
  protect,
  propertyController.deletePropertyImage,
);

router.patch(
  "/:id/images/:imageIndex/cover",
  protect,
  propertyController.setCoverImage,
);

module.exports = router;
