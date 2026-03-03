const Offer = require("../models/offerModel");
const Property = require("../models/propertyModel");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");

function buildOfferScopeQuery(user) {
  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  if (user.role === "admin") {
    return Offer.find();
  }

  if (user.role === "buyer") {
    return Offer.find({ buyer: user.id });
  }

  if (user.role === "agent") {
    return Offer.find().populate({
      path: "property",
      select: "owner agent",
    });
  }

  return Offer.find({ _id: null });
}

async function getOffers(query, user) {
  const baseQuery = buildOfferScopeQuery(user);

  const features = new ApiFeatures(baseQuery, query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let offers = await features.query.populate([
    { path: "property", select: "title owner agent" },
    { path: "buyer", select: "name email" },
  ]);

  if (user.role === "agent") {
    offers = offers.filter((o) => {
      const p = o.property;
      if (!p) return false;
      const ownerId = p.owner?.toString?.();
      const agentId = p.agent?.toString?.();
      return ownerId === user.id.toString() || agentId === user.id.toString();
    });
  }

  return offers;
}

async function getOfferById(id, user) {
  const offer = await Offer.findById(id).populate([
    { path: "buyer", select: "name email" },
    { path: "property", select: "title owner agent" },
  ]);

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  if (!user || !user.id || !user.role) {
    throw new AppError("Unauthorized", 401);
  }

  if (user.role === "admin") {
    return offer;
  }

  if (user.role === "buyer") {
    if (offer.buyer && offer.buyer._id.toString() !== user.id.toString()) {
      throw new AppError("You are not authorized to access this offer", 403);
    }
    return offer;
  }

  if (user.role === "agent") {
    const p = offer.property;
    const ownerId = p?.owner?.toString?.();
    const agentId = p?.agent?.toString?.();
    if (ownerId !== user.id.toString() && agentId !== user.id.toString()) {
      throw new AppError("You are not authorized to access this offer", 403);
    }
    return offer;
  }

  throw new AppError("You are not authorized to access this offer", 403);
}

async function createOffer(offerData, userId) {
  const { property, amount } = offerData;

  const propertyDoc = await Property.findById(property);
  if (!propertyDoc) {
    throw new AppError("Property not found", 404);
  }

  if (propertyDoc.owner.toString() === userId.toString()) {
    throw new AppError("You cannot make an offer on your own property", 400);
  }

  const existingOffer = await Offer.findOne({
    property,
    buyer: userId,
    status: "pending",
  });

  if (existingOffer) {
    throw new AppError(
      "You already have a pending offer for this property",
      400,
    );
  }

  const offer = await Offer.create({
    ...offerData,
    buyer: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  return await Offer.findById(offer._id).populate(
    "property buyer",
    "title name email",
  );
}

async function updateOffer(id, updateData, userId) {
  const offer = await Offer.findById(id);

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  if (offer.buyer.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to update this offer", 403);
  }

  if (offer.status !== "pending") {
    throw new AppError("You can only update pending offers", 400);
  }

  const updatedOffer = await Offer.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("property buyer", "title name email");

  return updatedOffer;
}

async function deleteOffer(id, userId) {
  const offer = await Offer.findById(id);

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  if (offer.buyer.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this offer", 403);
  }

  await Offer.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
}

async function acceptOffer(id, propertyOwnerId) {
  const offer = await Offer.findById(id).populate("property");

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  if (offer.property.owner.toString() !== propertyOwnerId.toString()) {
    throw new AppError("You are not authorized to accept this offer", 403);
  }

  if (offer.status !== "pending") {
    throw new AppError("This offer cannot be accepted", 400);
  }

  const updatedOffer = await Offer.findByIdAndUpdate(
    id,
    { status: "accepted" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  await Offer.updateMany(
    {
      property: offer.property._id,
      _id: { $ne: id },
      status: "pending",
    },
    { status: "rejected" },
  );

  return updatedOffer;
}

async function rejectOffer(id, propertyOwnerId) {
  const offer = await Offer.findById(id).populate("property");

  if (!offer) {
    throw new AppError("Offer not found", 404);
  }

  if (offer.property.owner.toString() !== propertyOwnerId.toString()) {
    throw new AppError("You are not authorized to reject this offer", 403);
  }

  if (offer.status !== "pending") {
    throw new AppError("This offer cannot be rejected", 400);
  }

  const updatedOffer = await Offer.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { returnDocument: "after" },
  ).populate("property buyer", "title name email");

  return updatedOffer;
}

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  acceptOffer,
  rejectOffer,
};
