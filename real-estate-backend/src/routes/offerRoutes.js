const express = require("express");
const offerController = require("../controllers/offerController");
const { protect } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validationMiddleware");
const {
  checkBuyerOwnership,
  checkPropertyOwnership,
} = require("../middlewares/ownershipMiddleware");
const {
  offerSchema,
  offerUpdateSchema,
  paginationSchema,
  offerFilterSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    validate(paginationSchema),
    validate(offerFilterSchema, "query"),
    offerController.getOffers,
  )
  .post(validate(offerSchema), offerController.createOffer);

router
  .route("/:id")
  .get(offerController.getOfferById)
  .patch(
    validate(offerUpdateSchema),
    checkBuyerOwnership(require("../models/offerModel"), "id"),
    offerController.updateOffer,
  )
  .delete(
    checkBuyerOwnership(require("../models/offerModel"), "id"),
    offerController.deleteOffer,
  );

router.patch(
  "/:id/accept",
  checkPropertyOwnership(require("../models/offerModel"), "id"),
  offerController.acceptOffer,
);

router.patch(
  "/:id/reject",
  checkPropertyOwnership(require("../models/offerModel"), "id"),
  offerController.rejectOffer,
);

module.exports = router;
