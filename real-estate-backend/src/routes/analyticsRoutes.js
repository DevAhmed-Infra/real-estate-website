const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");
const { restrictTo } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validationMiddleware");
const {
  analyticsSchema,
  analyticsUpdateSchema,
  paginationSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.post(
  "/track",
  validate(analyticsSchema),
  analyticsController.trackEvent,
);

router.use(protect);

router
  .route("/")
  .get(
    restrictTo("admin", "agent"),
    validate(paginationSchema),
    analyticsController.getAnalytics,
  )
  .post(
    restrictTo("admin", "agent"),
    validate(analyticsSchema),
    analyticsController.createAnalytics,
  );

router
  .route("/:id")
  .get(restrictTo("admin", "agent"), analyticsController.getAnalyticsById)
  .patch(
    restrictTo("admin", "agent"),
    validate(analyticsUpdateSchema),
    analyticsController.updateAnalytics,
  )
  .delete(restrictTo("admin"), analyticsController.deleteAnalytics);

router.get(
  "/property/:propertyId",
  restrictTo("admin", "agent"),
  analyticsController.getPropertyAnalytics,
);
router.get(
  "/user/:userId",
  restrictTo("admin", "agent"),
  analyticsController.getUserAnalytics,
);
router.get(
  "/events/stats",
  restrictTo("admin", "agent"),
  analyticsController.getEventStats,
);
router.get(
  "/dashboard/stats",
  restrictTo("admin", "agent"),
  analyticsController.getDashboardStats,
);

module.exports = router;
