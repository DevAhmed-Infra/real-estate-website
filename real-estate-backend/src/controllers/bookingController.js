const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");

const getBookings = asyncHandler(async (req, res, next) => {
  const bookings = await bookingService.getBookings(req.query, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

const getBookingById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.getBookingById(id, req.user);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const createBooking = asyncHandler(async (req, res, next) => {
  const booking = await bookingService.createBooking(req.body, req.user.id);

  res.status(201).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const updateBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.updateBooking(id, req.body, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const deleteBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await bookingService.deleteBooking(id, req.user.id);

  res.status(204).json({
    success: true,
    status: "success",
    data: null,
  });
});

const approveBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.approveBooking(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const rejectBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.rejectBooking(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const completeBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.completeBooking(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

const cancelBooking = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const booking = await bookingService.cancelBooking(id, req.user.id);

  res.status(200).json({
    success: true,
    status: "success",
    data: {
      booking,
    },
  });
});

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  approveBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
};
