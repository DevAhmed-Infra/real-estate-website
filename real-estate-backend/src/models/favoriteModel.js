const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
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

favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

favoriteSchema.index({ user: 1, createdAt: -1 }); 
favoriteSchema.index({ property: 1, createdAt: -1 }); 
favoriteSchema.index({ createdAt: -1 }); 
favoriteSchema.index({ user: 1, isDeleted: 1 }); 

favoriteSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Favorite", favoriteSchema);
