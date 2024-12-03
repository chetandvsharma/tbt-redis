import { WebSocketServer } from "ws";
import { createClient } from "redis";
import cluster from "cluster";
import os from "os";

const numCPUs = os.cpus().length; // Number of CPU cores for clustering
const BATCH_SIZE = 100; // Increased batch size
const INTERVAL = 50; // Interval in ms for processing batches (~20 batches/second)

if (cluster.isMaster) {
  console.log(`Master process started. Forking ${numCPUs} workers.`);
  
  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited.`);
    // Optionally restart a worker if needed
    cluster.fork();
  });
} else {
  // Worker process starts here
  const wss = new WebSocketServer({ port: 7000 });
  const redisClient = createClient();

  // Handle Redis errors
  redisClient.on("error", (err) => console.error("Redis Error:", err));

  (async () => {
    await redisClient.connect();
    console.log(`Worker ${process.pid} connected to Redis and WebSocket.`);

    // Function to broadcast a message to all connected WebSocket clients
    const broadcastMessage = (message) => {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    };

    // Interval-based message consumption with Redis pipelining
    setInterval(async () => {
      try {
        const pipeline = redisClient.multi();
        pipeline.lRange("messageQueue", 0, BATCH_SIZE - 1); // Fetch messages
        pipeline.lTrim("messageQueue", BATCH_SIZE, -1); // Remove fetched messages
        const results = await pipeline.exec();
        const messages = results[0][1]; // Extract messages from the pipeline response

        if (messages && messages.length > 0) {
          // Broadcast messages to WebSocket clients
          messages.forEach((message) => {
            broadcastMessage(message);
          });
          console.log(`Worker ${process.pid} processed ${messages.length} messages.`);
        }
      } catch (err) {
        console.error(`Worker ${process.pid} error:`, err);
      }
    }, INTERVAL);

    // Handle WebSocket connections
    wss.on("connection", (ws) => {
      console.log(`Worker ${process.pid}: WebSocket client connected.`);
      ws.on("close", () => console.log(`Worker ${process.pid}: WebSocket client disconnected.`));
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log(`Worker ${process.pid} shutting down...`);
      await redisClient.quit();
      process.exit(0);
    });
  })();
}
