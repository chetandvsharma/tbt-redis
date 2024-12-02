import { WebSocketServer } from "ws";
import { createClient } from "redis";
import cluster from "cluster";
import os from "os";

const numCPUs = os.cpus().length;

// Check if this is the master process
if (cluster.isMaster) {
  console.log(`Master process started with PID: ${process.pid}`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart workers if they crash
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited. Forking a new one.`);
    cluster.fork();
  });
} else {
  // Worker process logic
  const wss = new WebSocketServer({ port: 5000 });
  const numRedisClients = 4; // Number of Redis clients for better performance
  const redisClients = Array.from({ length: numRedisClients }, () => createClient());

  // Initialize Redis clients
  Promise.all(redisClients.map((client) => client.connect()))
    .then(() => {
      console.log(`Worker ${process.pid} connected to Redis.`);
    })
    .catch((err) => {
      console.error(`Worker ${process.pid} failed to connect to Redis:`, err);
      process.exit(1); // Exit if Redis connection fails
    });

  // Function to distribute Redis clients
  let clientIndex = 0;
  const getRedisClient = () => redisClients[clientIndex++ % numRedisClients];

  // Batch size and message generation logic
  const BATCH_SIZE = 100;
  const INTERVAL = 1000 / (200 / BATCH_SIZE); // Target ~n messages per second
  let flag = 1;

  setInterval(async () => {
    try {
      const pipeline = getRedisClient().multi(); // Use Redis pipeline
      for (let i = 0; i < BATCH_SIZE; i++) {
        const message = JSON.stringify({
          Token: flag++,
          Hour_min_sec: new Date(),
          open: (Math.random() * 1000).toFixed(2),
          high: (Math.random() * 1000).toFixed(2),
          low: (Math.random() * 1000).toFixed(2),
          close: (Math.random() * 1000).toFixed(2),
          vol: (Math.random() * 10000).toFixed(0),
          buyerVol: (Math.random() * 10000).toFixed(0),
          sellerVol: (Math.random() * 10000).toFixed(0),
          ofBuyOrders: (Math.random() * 10000).toFixed(0),
          ofSellOrders: (Math.random() * 10000).toFixed(0),
          marketIocOrder: (Math.random() * 10000).toFixed(0),
          algoOrder: (Math.random() * 10000).toFixed(0),
          discloseOrder: (Math.random() * 10000).toFixed(0),
          disrderValueAboveThresholdCountCloseOrder: (Math.random() * 10000).toFixed(0),
          orderValueAboveThresholdValue: (Math.random() * 10000).toFixed(0),
        });
        pipeline.rPush("messageQueue", message);
      }
      await pipeline.exec(); // Execute pipeline
    } catch (err) {
      console.error(`Worker ${process.pid} failed to push messages:`, err);
    }
  }, INTERVAL);

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log(`Worker ${process.pid}: Client connected to producer`);
  });

  // Handle WebSocket server errors
  wss.on("error", (err) => {
    console.error(`Worker ${process.pid} WebSocket Server Error:`, err);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log(`Worker ${process.pid} shutting down...`);
    await Promise.all(redisClients.map((client) => client.disconnect()));
    process.exit(0);
  });
}
