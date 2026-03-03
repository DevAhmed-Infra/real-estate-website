const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "new_offer",
        "offer_status",
        "booking_confirmed",
        "booking_cancelled",
        "property_update",
        "system_announcement",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
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

notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Notification", notificationSchema);
