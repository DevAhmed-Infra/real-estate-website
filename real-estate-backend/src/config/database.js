const mongoose = require("mongoose");
const { configureMongoSecurity } = require("./security");
const logger = require("../utils/logger");

async function connectDatabase() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    logger.error("MONGO_URL is not defined in environment variables.");
    process.exit(1);
  }

  configureMongoSecurity(mongoose);

  await mongoose.connect(mongoUrl, {
    autoIndex: true,
    maxPoolSize: 20,
  });

  logger.info("Connected to MongoDB");

  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};

