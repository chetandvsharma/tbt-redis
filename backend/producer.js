import { WebSocketServer } from "ws";
import { createClient } from "redis";

// Initialize WebSocket and Redis client
const wss = new WebSocketServer({ port: 5000 });
const redisClient = createClient();

// Handle Redis client errors
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Confirm Redis client is ready
redisClient.on("ready", () => {
  console.log("Redis client ready.");
});

// Connect Redis client
await redisClient.connect();
console.log(await redisClient.ping());
console.log("Producer WebSocket server running on ws://localhost:5000");

// Generate JSON data at 12,000 messages per second
setInterval(async () => {
  try {
    const message = JSON.stringify({
      id: Date.now(),
      name: `User${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      age: Math.floor(Math.random() * 50) + 18,
      experience: `${Math.floor(Math.random() * 15)} years`,
      position: "Developer",
    });

    // console.log("Generated message:", message);

    // Push message to Redis queue
    await redisClient.rPush("messageQueue", message);
    console.log("Message pushed to Redis.");
  } catch (err) {
    console.error("Error pushing message to Redis:", err);
  }
}, 1000 / 12000); // ~12,000 messages per second

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("Client connected to producer");
});

// Handle WebSocket server errors
wss.on("error", (err) => {
  console.error("WebSocket Server Error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await redisClient.disconnect();
  process.exit(0);
});
