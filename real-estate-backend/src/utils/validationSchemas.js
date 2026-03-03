const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).trim(),
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    }),
  role: Joi.string().valid("buyer", "agent", "admin").default("buyer"),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .allow(""),
});

const loginSchema = Joi.object({
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  // Refresh token can be provided via httpOnly cookie; controller enforces presence.
  refreshToken: Joi.string().optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email().trim().lowercase(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

const propertySchema = Joi.object({
  title: Joi.string().required().min(3).max(100).trim(),
  description: Joi.string().max(1000).allow(""),
  type: Joi.string()
    .valid("apartment", "villa", "studio", "office", "land")
    .required(),
  status: Joi.string().valid("draft", "active", "sold", "rented", "archived"),
  price: Joi.number().positive().required(),
  priceType: Joi.string().valid("sale", "rent").required(),
  currency: Joi.string().default("USD"),
  area: Joi.number().positive(),
  bedrooms: Joi.number().integer().min(0).max(20),
  bathrooms: Joi.number().integer().min(0).max(20),
  amenities: Joi.array().items(Joi.string().max(50)).max(20),
  location: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array()
      .items(Joi.number().required())
      .length(2)
      .required(),
    address: Joi.string().max(200).allow(""),
    city: Joi.string().max(50).allow(""),
    country: Joi.string().max(50).allow(""),
  }).required(),
  images: Joi.array().items(Joi.string().uri()).max(20),
  coverImage: Joi.string().uri().allow(""),
});

const propertyUpdateSchema = propertySchema.fork(
  ["title", "type", "price", "priceType", "location"],
  (schema) => schema.optional(),
);

const offerSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  amount: Joi.number().positive().required(),
  expiresAt: Joi.date().iso().greater("now").optional(),
});

const offerUpdateSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  expiresAt: Joi.date().iso().greater("now").optional(),
});

const bookingSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  scheduledDate: Joi.date().iso().greater("now").required(),
  message: Joi.string().max(500).allow(""),
});

const bookingUpdateSchema = Joi.object({
  scheduledDate: Joi.date().iso().greater("now").optional(),
  message: Joi.string().max(500).allow("").optional(),
});

const reviewSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow(""),
});

const reviewUpdateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().max(1000).allow("").optional(),
});

const favoriteSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().optional(),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .allow("")
    .optional(),
  photo: Joi.object({
    url: Joi.string().uri().allow("").optional(),
    publicId: Joi.string().allow("").optional(),
    format: Joi.string().allow("").optional(),
    size: Joi.number().positive().optional(),
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
  }).optional(),
});

const adminCreateUserSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).trim(),
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: Joi.string().valid("buyer", "agent", "admin").default("buyer"),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .allow(""),
});

const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
});

const analyticsSchema = Joi.object({
  eventType: Joi.string()
    .valid("view", "favorite", "offer_created", "booking_created", "search")
    .required(),
  entityType: Joi.string().valid("property", "user").required(),
  entityId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  metadata: Joi.object({
    userAgent: Joi.string().max(500).allow("").optional(),
    ipAddress: Joi.string().ip().optional(),
    location: Joi.object({
      type: Joi.string().valid("Point").required(),
      coordinates: Joi.array()
        .items(Joi.number().required())
        .length(2)
        .required(),
    }).optional(),
    searchQuery: Joi.string().max(200).allow("").optional(),
    filters: Joi.object().optional(),
  }).optional(),
});

const analyticsUpdateSchema = Joi.object({
  eventType: Joi.string()
    .valid("view", "favorite", "offer_created", "booking_created", "search")
    .optional(),
  metadata: Joi.object().optional(),
});

const notificationSchema = Joi.object({
  recipient: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  type: Joi.string()
    .valid(
      "new_offer",
      "offer_status",
      "booking_confirmed",
      "booking_cancelled",
      "property_update",
      "system_announcement",
    )
    .required(),
  title: Joi.string().required().min(1).max(100),
  message: Joi.string().required().min(1).max(500),
  relatedEntity: Joi.object({
    entityType: Joi.string().required(),
    entityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }).optional(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  fields: Joi.string().optional(),
});

const propertyFilterSchema = Joi.object({
  type: Joi.string()
    .valid("apartment", "villa", "studio", "office", "land")
    .optional(),
  status: Joi.string()
    .valid("draft", "active", "sold", "rented", "archived")
    .optional(),
  priceType: Joi.string().valid("sale", "rent").optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  city: Joi.string().max(50).optional(),
  bedrooms: Joi.number().integer().min(0).max(20).optional(),
  bathrooms: Joi.number().integer().min(0).max(20).optional(),
  search: Joi.string().max(100).optional(),
});

const offerFilterSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  status: Joi.string()
    .valid("pending", "countered", "accepted", "rejected", "withdrawn")
    .optional(),
  buyer: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

const bookingFilterSchema = Joi.object({
  property: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "completed", "cancelled")
    .optional(),
  buyer: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,

  propertySchema,
  propertyUpdateSchema,

  offerSchema,
  offerUpdateSchema,

  bookingSchema,
  bookingUpdateSchema,

  reviewSchema,
  reviewUpdateSchema,

  favoriteSchema,

  userUpdateSchema,
  adminCreateUserSchema,
  passwordChangeSchema,

  analyticsSchema,
  analyticsUpdateSchema,

  notificationSchema,

  paginationSchema,
  propertyFilterSchema,
  offerFilterSchema,
  bookingFilterSchema,
};
