
function log(level, message, meta) {
  const payload = {
    level,
    message,
    ...(meta && Object.keys(meta).length ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

module.exports = {
  info(message, meta = undefined) {
    log("info", message, meta);
  },
  warn(message, meta = undefined) {
    log("warn", message, meta);
  },
  error(message, meta = undefined) {
    log("error", message, meta);
  },
};

