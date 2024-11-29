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
let flag = 1;
setInterval(async () => {
  try {
    const message = JSON.stringify({
      Token: flag,
      Hour_min_sec: Date.now(),
      open: Math.random(),
      high: Math.random(),
      low: Math.random(),
      close: Math.random(),
      vol: Math.random(),
      buyerVol: Math.random(),
      sellerVol: Math.random(),
      ofBuyOrders: Math.random(),
      ofSellOrders: Math.random(),
      marketIocOrder: Math.random(),
      algoOrder: Math.random(),
      discloseOrder: Math.random(),
      disrderValueAboveThresholdCountCloseOrder: Math.random(),
      orderValueAboveThresholdValue: Math.random(),
    });
    flag++;
    // Push message to Redis queue
    await redisClient.rPush("messageQueue", message);
    console.log("Message pushed to Redis.");
  } catch (err) {
    console.error("Error pushing message to Redis:", err);
  }
}, 1000 / 2000); // ~12,000 messages per second

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
