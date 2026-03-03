const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoSanitize = require("mongo-sanitize");
const xss = require("xss");

const {
  globalErrorHandler,
  notFoundHandler,
} = require("./middlewares/errorMiddleware");
const { apiLimiter } = require("./middlewares/rateLimiter");
const config = require("./config/appConfig");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const offerRoutes = require("./routes/offerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api", apiLimiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ive needed to change the whole package due to the usage of express 5
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }
  next();
});

// Custom XSS protection middleware , ive needed to change it due to the usage of express 5
app.use((req, res, next) => {
  const sanitizeXSS = (obj) => {
    if (typeof obj === "string") {
      return xss(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeXSS(item));
    }
    if (typeof obj === "object" && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeXSS(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeXSS(req.body);
  }
  if (req.query) {
    req.query = sanitizeXSS(req.query);
  }

  next();
});

app.use(compression());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "success",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(`${config.apiBasePath}/auth`, authRoutes);
app.use(`${config.apiBasePath}/users`, userRoutes);
app.use(`${config.apiBasePath}/properties`, propertyRoutes);
app.use(`${config.apiBasePath}/offers`, offerRoutes);
app.use(`${config.apiBasePath}/bookings`, bookingRoutes);
app.use(`${config.apiBasePath}/reviews`, reviewRoutes);
app.use(`${config.apiBasePath}/favorites`, favoriteRoutes);
app.use(`${config.apiBasePath}/notifications`, notificationRoutes);
app.use(`${config.apiBasePath}/analytics`, analyticsRoutes);

app.use(notFoundHandler);

app.use(globalErrorHandler);

module.exports = app;
