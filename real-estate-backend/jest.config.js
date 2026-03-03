module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/app.js",
    "!src/config/**",
    "!src/dev-data/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
