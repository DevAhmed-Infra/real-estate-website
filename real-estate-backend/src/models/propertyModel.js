const mongoose = require("mongoose");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["apartment", "villa", "studio", "office", "land"],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "sold", "rented", "archived"],
      default: "draft",
      index: true,
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    priceType: {
      type: String,
      enum: ["sale", "rent"],
      index: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    area: Number,
    bedrooms: { type: Number, index: true },
    bathrooms: { type: Number, index: true },
    amenities: [String],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
      city: { type: String, index: true },
      country: String,
    },
    images: [
      {
        type: {
          url: String,
          publicId: String,
          format: String,
          size: Number,
          width: Number,
          height: Number,
          caption: String,
          isPrimary: {
            type: Boolean,
            default: false,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
        default: [],
      },
    ],
    coverImage: {
      type: {
        url: String,
        publicId: String,
        format: String,
        size: Number,
        width: Number,
        height: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      index: true,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    boostScore: {
      type: Number,
      default: 0,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    soldAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

propertySchema.index({ location: "2dsphere" });
propertySchema.index({ price: 1, bedrooms: 1 });
propertySchema.index({ "location.city": 1, price: 1 });
propertySchema.index({ title: "text", description: "text", amenities: "text" });

propertySchema.index({ owner: 1, status: 1 });
propertySchema.index({ "location.city": 1, type: 1 });
propertySchema.index({ price: 1, status: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ averageRating: -1 });
propertySchema.index({ viewsCount: -1 });
propertySchema.index({ isFeatured: 1, status: 1 });
propertySchema.index({ owner: 1, isDeleted: 1 });

propertySchema.pre("save", function () {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

propertySchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Property", propertySchema);
