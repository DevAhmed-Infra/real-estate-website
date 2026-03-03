const AppError = require("../utils/appError");
const logger = require("../utils/logger");

function globalErrorHandler(err, req, res, next) {
  const error = { ...err };
  error.message = err.message || "Something went wrong";

  // Determine statusCode/status in a way that also works for non-AppError errors
  let statusCode = err.statusCode || 500;
  let status = err.status || "error";

  logger.error("Request error", {
    url: req.originalUrl,
    method: req.method,
    statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((el) => el.message);
    error.message = messages.join(". ");
  }

  // Joi validation errors (from validateAsync)
  if (err.isJoi) {
    statusCode = 400;
    status = "fail";
    if (Array.isArray(err.details) && err.details.length > 0) {
      error.message = err.details.map((d) => d.message).join(". ");
    }
  }

  if (err.code === 11000) {
    statusCode = 409;
    status = "fail";
    error.message = "Duplicate field value entered";
  }

  // Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    status = "fail";
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    status = "fail";
    error.message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    status = "fail";
    error.message = "Your token has expired. Please log in again.";
  }

  const response = {
    success: false,
    status,
    message: error.message || "Internal server error",
  };

  // SECURITY: only expose stack traces in explicit development.
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

function notFoundHandler(req, res, next) {
  // Ignore favicon.ico requests to prevent 404 noise
  if (req.originalUrl === "/favicon.ico") {
    return res.status(204).end();
  }

  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
};
