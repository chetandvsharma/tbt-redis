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

// Function to broadcast a message to all connected clients
const broadcastMessage = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

// Periodically consume messages from Redis and broadcast
setInterval(async () => {
  try {
    const message = await redisClient.lPop("messageQueue"); // Pop the oldest message
    if (message) {
      console.log("Broadcasting message:", message);
      broadcastMessage(message); // Broadcast to all clients
    }
  } catch (err) {
    console.error("Error consuming message from Redis:", err);
  }
}, 10); // Adjust interval for performance

// Log client connections
wss.on("connection", (ws) => {
  console.log("Frontend client connected");
  ws.on("close", () => console.log("Frontend client disconnected"));
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
