const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["property", "user"],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["view", "favorite", "offer_created", "booking_created", "search"],
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: [Number],
      },
      searchQuery: String,
      filters: Object,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

analyticsSchema.index({ entityType: 1, entityId: 1, eventType: 1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

analyticsSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ entityId: 1, eventType: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, isDeleted: 1 });
analyticsSchema.index({ "metadata.location": "2dsphere" });

analyticsSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Analytics", analyticsSchema);
