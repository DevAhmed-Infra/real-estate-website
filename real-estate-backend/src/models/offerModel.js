const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "countered", "accepted", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },
    expiresAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

offerSchema.index(
  { property: 1, buyer: 1, status: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { status: "pending" },
  },
);

offerSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Offer", offerSchema);
