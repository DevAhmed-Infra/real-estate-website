const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: String,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

reviewSchema.index({ property: 1, user: 1 }, { unique: true });

reviewSchema.index({ property: 1, rating: -1 }); 
reviewSchema.index({ user: 1, createdAt: -1 }); 
reviewSchema.index({ rating: -1 }); 
reviewSchema.index({ createdAt: -1 }); 
reviewSchema.index({ property: 1, isDeleted: 1 }); 

reviewSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Review", reviewSchema);
