import { WebSocketServer } from "ws";
import { createClient } from "redis";

// Initialize WebSocket and Redis client
const wss = new WebSocketServer({ port: 7000 });
const redisClient = createClient();

// Handle Redis client errors
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

await redisClient.connect();
console.log("Consumer WebSocket server running on ws://localhost:7000");

wss.on("connection", (ws) => {
  console.log("Frontend connected to consumer");

  const intervalId = setInterval(async () => {
    try {
      const message = await redisClient.lPop("messageQueue"); // Pop the oldest message
      if (message) {
        console.log("Sending message:", message);
        ws.send(message); // Send the message to the frontend
      }
    } catch (err) {
      console.error("Error processing Redis message:", err);
    }
  }, 1); // Process messages as fast as possible

  ws.on("close", () => {
    console.log("Frontend disconnected");
    clearInterval(intervalId); // Stop interval when client disconnects
  });

  ws.on("error", (err) => {
    console.error("WebSocket Error:", err);
    clearInterval(intervalId); // Cleanup on error
  });
});

wss.on("error", (err) => {
  console.error("WebSocket Server Error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  try {
    await redisClient.quit();
    console.log("Redis client disconnected");
  } catch (err) {
    console.error("Error during Redis disconnect:", err);
  }
  process.exit(0);
});
