import React, { useState } from "react";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const aiMessage = {
        role: "assistant",
        text: data.response || data.error || "No response",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error chatting:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "[Error connecting to AI]" },
      ]);
    }
  };

  return (
    <div>
      <h2>Chat with Llama3.2</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
          height: "200px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.role}:</b> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;
