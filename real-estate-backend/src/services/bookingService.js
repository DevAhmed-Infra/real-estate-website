const Booking = require("../models/bookingModel");
const Property = require("../models/propertyModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

async function getAgentPropertyIds(agentId) {
  const props = await Property.find({
    $or: [{ owner: agentId }, { agent: agentId }],
  }).select("_id");
  return props.map((p) => p._id);
}

async function buildBookingScopeQuery(user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  if (user.role === "admin") {
    return Booking.find();
  }

  if (user.role === "buyer") {
    return Booking.find({ buyer: user.id });
  }

  if (user.role === "agent") {
    const propertyIds = await getAgentPropertyIds(user.id);
    return Booking.find({ property: { $in: propertyIds } });
  }

  return Booking.find({ _id: null });
}

async function getBookings(query, user) {
  const baseQuery = await buildBookingScopeQuery(user);

  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookings = await features.query.populate(
    "property buyer",
    "title name email",
  );

  return bookings;
}

async function getBookingById(id, user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  const booking = await Booking.findById(id).populate([
    { path: "buyer", select: "name email" },
    { path: "property", select: "title owner agent" },
  ]);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (user.role === "admin") {
    return booking;
  }

  if (user.role === "buyer") {
    if (booking.buyer && booking.buyer._id.toString() !== user.id.toString()) {
      throw new AppError("You are not authorized to access this booking", 403);
    }
    return booking;
  }

  if (user.role === "agent") {
    const p = booking.property;
    const ownerId = p?.owner?.toString?.();
    const agentId = p?.agent?.toString?.();
    if (ownerId !== user.id.toString() && agentId !== user.id.toString()) {
      throw new AppError("You are not authorized to access this booking", 403);
    }
    return booking;
  }

  throw new AppError("You are not authorized to access this booking", 403);
}

async function createBooking(bookingData, userId) {
  const { property, scheduledDate } = bookingData;

  const propertyDoc = await Property.findById(property);
  if (!propertyDoc) {
    throw new AppError("Property not found", 404);
  }

  if (propertyDoc.owner.toString() === userId.toString()) {
    throw new AppError("You cannot book a viewing for your own property", 400);
  }

  const existingBooking = await Booking.findOne({
    property,
    scheduledDate,
    status: { $in: ["pending", "approved"] },
  });

  if (existingBooking) {
    throw new AppError(
      "This property is already booked for this date and time",
      400,
    );
  }

  const bookingDate = new Date(scheduledDate);
  const now = new Date();

  if (bookingDate <= now) {
    throw new AppError("Scheduled date must be in the future", 400);
  }

  const booking = await Booking.create({
    ...bookingData,
    buyer: userId,
  });

  return await Booking.findById(booking._id).populate(
    "property buyer",
    "title name email",
  );
}

async function updateBooking(id, updateData, userId) {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.buyer.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to update this booking", 403);
  }

  if (booking.status !== "pending") {
    throw new AppError("You can only update pending bookings", 400);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("property buyer", "title name email");

  return updatedBooking;
}

async function deleteBooking(id, userId) {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.buyer.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this booking", 403);
  }

  await Booking.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
}

async function approveBooking(id, propertyOwnerId) {
  const booking = await Booking.findById(id).populate("property");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.property.owner.toString() !== propertyOwnerId.toString()) {
    throw new AppError("You are not authorized to approve this booking", 403);
  }

  if (booking.status !== "pending") {
    throw new AppError("This booking cannot be approved", 400);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { status: "approved" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  return updatedBooking;
}

async function rejectBooking(id, propertyOwnerId) {
  const booking = await Booking.findById(id).populate("property");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.property.owner.toString() !== propertyOwnerId.toString()) {
    throw new AppError("You are not authorized to reject this booking", 403);
  }

  if (booking.status !== "pending") {
    throw new AppError("This booking cannot be rejected", 400);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  return updatedBooking;
}

async function completeBooking(id, propertyOwnerId) {
  const booking = await Booking.findById(id).populate("property");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.property.owner.toString() !== propertyOwnerId.toString()) {
    throw new AppError("You are not authorized to complete this booking", 403);
  }

  if (booking.status !== "approved") {
    throw new AppError("This booking cannot be completed", 400);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { status: "completed" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  return updatedBooking;
}

async function cancelBooking(id, userId) {
  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.buyer.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new AppError("This booking cannot be cancelled", 400);
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { status: "cancelled" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  return updatedBooking;
}

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
