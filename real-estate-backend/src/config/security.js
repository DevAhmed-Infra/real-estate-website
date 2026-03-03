function configureMongoSecurity(mongoose) {
  // Ensure strict query mode to avoid query selector injection
  mongoose.set("strictQuery", true);
}

module.exports = {
  configureMongoSecurity,
};

