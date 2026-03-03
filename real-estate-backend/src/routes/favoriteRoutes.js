const express = require("express");
const favoriteController = require("../controllers/favoriteController");
const { protect } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validationMiddleware");
const { checkBuyerOwnership } = require("../middlewares/ownershipMiddleware");
const {
  favoriteSchema,
  paginationSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(validate(paginationSchema), favoriteController.getFavorites)
  .post(validate(favoriteSchema), favoriteController.addFavorite);

router
  .route("/:id")
  .get(favoriteController.getFavoriteById)
  .delete(
    checkBuyerOwnership(require("../models/favoriteModel"), "id"),
    favoriteController.deleteFavorite,
  );

router.get("/user/my-favorites", favoriteController.getUserFavorites);
router.delete("/property/:property", favoriteController.removeFavorite);
router.get("/property/:property/check", favoriteController.checkFavoriteStatus);

module.exports = router;
