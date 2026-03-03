const dotenv = require("dotenv");
dotenv.config();

const http = require("http");

const app = require("./app");
const { connectDatabase } = require("./config/database");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

startServer();
