const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokens: [
      {
        token: {
          type: String,
          select: false,
        },
        expiresAt: Date,
      },
    ],
    role: {
      type: String,
      enum: ["buyer", "seller", "agent", "admin"],
      default: "buyer",
      index: true,
    },
    phone: String,
    profilePhoto: {
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
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationTokenHash: {
      type: String,
      select: false,
      sparse: true,
    },
    emailVerificationTokenExpires: {
      type: Date,
      index: { expireAfterSeconds: 0 },
      select: false,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
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

userSchema.index({ role: 1, averageRating: -1 });

userSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
