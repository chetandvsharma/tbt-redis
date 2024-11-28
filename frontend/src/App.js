import React, { useState, useEffect } from "react";

const App = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:7000");

    // Log connection opening
    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };

    // Handle incoming messages
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        setMessages((prevMessages) =>
          [message, ...prevMessages].slice(0, 100) // Limit to 100 messages
        );
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    // Log connection closure
    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log("WebSocket connection closed cleanly.");
      } else {
        console.error("WebSocket closed unexpectedly:", event);
      }
    };

    // Log errors
    socket.onerror = (err) => {
      console.error("WebSocket encountered an error:", err);
    };

    // Cleanup WebSocket on unmount
    return () => {
      console.log("Cleaning up WebSocket connection...");
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>Real-Time Messages</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>
            {msg.id} - {msg.name} ({msg.email}) - {msg.position}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
