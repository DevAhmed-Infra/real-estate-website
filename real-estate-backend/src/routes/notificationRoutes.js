const express = require("express");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");
const { restrictTo } = require("../middlewares/roleGuard");
const { validate } = require("../middlewares/validationMiddleware");
const {
  notificationSchema,
  paginationSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(validate(paginationSchema), notificationController.getNotifications)
  .post(
    restrictTo("admin"),
    validate(notificationSchema),
    notificationController.createNotification,
  );

router.patch("/read-all", notificationController.markAllAsRead);
router.get("/unread/count", notificationController.getUnreadCount);

router
  .route("/:id")
  .get(notificationController.getNotificationById)
  .patch(notificationController.updateNotification)
  .delete(notificationController.deleteNotification);

router.get(
  "/user/my-notifications",
  notificationController.getUserNotifications,
);

router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
