const asyncHandler = require("../utils/asyncHandler");
const offerService = require("../services/offerService");

const getOffers = asyncHandler(async (req, res, next) => {
  const offers = await offerService.getOffers(req.query, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    results: offers.length,
    data: {
      offers,
    },
  });
});

const getOfferById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const offer = await offerService.getOfferById(id, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      offer,
    },
  });
});

const createOffer = asyncHandler(async (req, res, next) => {
  const offer = await offerService.createOffer(req.body, req.user.id);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      offer,
    },
  });
});

const updateOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const offer = await offerService.updateOffer(id, req.body, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      offer,
    },
  });
});

const deleteOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await offerService.deleteOffer(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const acceptOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const offer = await offerService.acceptOffer(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      offer,
    },
  });
});

const rejectOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const offer = await offerService.rejectOffer(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      offer,
    },
  });
});

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  acceptOffer,
  rejectOffer,
};
