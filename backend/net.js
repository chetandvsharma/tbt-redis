import net from "net";

const HOST = "192.178.49.321";
const PORT = 7999;

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log(`Connected to ${HOST}:${PORT}`);
});

client.on("data", (data) => {
  console.log("Received data:", data);
});

client.on("error", (err) => {
  console.error("Error:", err);
});

client.on("close", () => {
  console.log("Connection closed");
});
