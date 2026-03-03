const express = require("express");
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validationMiddleware");
const { checkBuyerOwnership } = require("../middlewares/ownershipMiddleware");
const {
  reviewSchema,
  reviewUpdateSchema,
  paginationSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(validate(paginationSchema), reviewController.getReviews)
  .post(validate(reviewSchema), reviewController.createReview);

router
  .route("/:id")
  .get(reviewController.getReviewById)
  .patch(
    validate(reviewUpdateSchema),
    checkBuyerOwnership(require("../models/reviewModel"), "id"),
    reviewController.updateReview,
  )
  .delete(
    checkBuyerOwnership(require("../models/reviewModel"), "id"),
    reviewController.deleteReview,
  );

router.get("/property/:propertyId", reviewController.getPropertyReviews);

module.exports = router;
