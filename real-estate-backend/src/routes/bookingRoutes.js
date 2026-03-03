const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validationMiddleware");
const {
  checkBuyerOwnership,
  checkPropertyOwnership,
} = require("../middlewares/ownershipMiddleware");
const {
  bookingSchema,
  bookingUpdateSchema,
  paginationSchema,
  bookingFilterSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    validate(paginationSchema),
    validate(bookingFilterSchema, "query"),
    bookingController.getBookings,
  )
  .post(validate(bookingSchema), bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBookingById)
  .patch(
    validate(bookingUpdateSchema),
    checkBuyerOwnership(require("../models/bookingModel"), "id"),
    bookingController.updateBooking,
  )
  .delete(
    checkBuyerOwnership(require("../models/bookingModel"), "id"),
    bookingController.deleteBooking,
  );

router.patch(
  "/:id/approve",
  checkPropertyOwnership(require("../models/bookingModel"), "id"),
  bookingController.approveBooking,
);

router.patch(
  "/:id/reject",
  checkPropertyOwnership(require("../models/bookingModel"), "id"),
  bookingController.rejectBooking,
);

router.patch(
  "/:id/complete",
  checkPropertyOwnership(require("../models/bookingModel"), "id"),
  bookingController.completeBooking,
);

router.patch(
  "/:id/cancel",
  checkBuyerOwnership(require("../models/bookingModel"), "id"),
  bookingController.cancelBooking,
);

module.exports = router;
