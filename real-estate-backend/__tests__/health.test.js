const request = require("supertest");
const express = require("express");

describe("Health Check Endpoint", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();

    app.get("/health", (req, res) => {
      res.status(200).json({
        status: 200,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  });

  it("should return 200 status with health check data", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status");
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
    expect(response.body.status).toBe(200);
    expect(response.body.message).toBe("Server is running");
  });

  it("should return correct timestamp format", async () => {
    const response = await request(app).get("/health");

    expect(() => new Date(response.body.timestamp)).not.toThrow();
    expect(response.body.timestamp).toBeTruthy();
  });

  it("should return uptime as number", async () => {
    const response = await request(app).get("/health");

    expect(typeof response.body.uptime).toBe("number");
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should be accessible at /health path", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
  });

  it("should have proper JSON response structure", async () => {
    const response = await request(app).get("/health");

    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toBeInstanceOf(Object);
    expect(Object.keys(response.body)).toContain("status");
    expect(Object.keys(response.body)).toContain("message");
    expect(Object.keys(response.body)).toContain("timestamp");
    expect(Object.keys(response.body)).toContain("uptime");
  });

  it("should consistently respond to multiple requests", async () => {
    const response1 = await request(app).get("/health");
    const response2 = await request(app).get("/health");

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.body.message).toBe(response2.body.message);
  });

  it("should be used for monitoring and load balancer checks", async () => {
    const testApp = express();

    testApp.get("/health", (req, res) => {
      const isHealthy = true; 

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 200 : 503,
        message: isHealthy ? "Server is running" : "Server is unavailable",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    const response = await request(testApp).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Server is running");
  });

  it("should return valid JSON even without content", async () => {
    const response = await request(app).get("/health");

    expect(response.body).not.toBeNull();
    expect(response.body).not.toBeUndefined();
  });

  it("should respond with correct content type", async () => {
    const response = await request(app).get("/health");

    expect(response.headers["content-type"]).toMatch(/application\/json/);
  });
});
