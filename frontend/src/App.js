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

        setMessages(
          (prevMessages) => [message, ...prevMessages].slice(0, 2000) // Limit to 100 messages
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
      <table>
        <tr>
          <th>Token</th>
          <th>Hour_min_sec</th>
          <th>open</th>
          <th>high</th>
          <th>low</th>
          <th>close</th>
          <th>vol</th>
          <th>buyerVol</th>
          <th>sellerVol</th>
          <th>ofBuyOrders</th>
          <th>ofSellOrders</th>
          <th>marketIocOrder</th>
          <th>algoOrder</th>
          <th>discloseOrder</th>
          <th>disrderValueAboveThresholdCountCloseOrder</th>
          <th>orderValueAboveThresholdValue</th>
        </tr>
        {messages.map((msg, index) => (
          <tr key={index}>
            <td>{msg.Token}</td>
            <td>{msg.Hour_min_sec}</td>
            <td>{msg.open}</td>
            <td>{msg.high}</td>
            <td>{msg.low}</td>
            <td>{msg.close}</td>
            <td>{msg.vol}</td>
            <td>{msg.buyerVol}</td>
            <td>{msg.sellerVol}</td>
            <td>{msg.ofBuyOrders}</td>
            <td>{msg.ofSellOrders}</td>
            <td>{msg.marketIocOrder}</td>
            <td>{msg.algoOrder}</td>
            <td>{msg.discloseOrder}</td>
            <td>{msg.disrderValueAboveThresholdCountCloseOrder}</td>
            <td>{msg.orderValueAboveThresholdValue}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

export default App;
