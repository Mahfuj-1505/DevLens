import React, {useState, useRef, useEffect} from "react";
import {User, Bot} from "lucide-react";
import "./ChatBox.css";
import {api} from "../api.js";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
        const handleResize = () => {
            messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [messages, streamingText]);

    const typeText = (text, delay = 30) => {
        return new Promise((resolve) => {
            setIsStreaming(true);
            setStreamingText("");
            let index = 0;

            const interval = setInterval(() => {
                if (index < text.length) {
                    setStreamingText(text.substring(0, index + 1));
                    index++;
                } else {
                    clearInterval(interval);
                    setIsStreaming(false);
                    resolve();
                }
            }, delay);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || isStreaming) return;

        const userMessage = {role: "user", text: input};
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        setTimeout(() => textareaRef.current?.focus(), 0);

        await new Promise((resolve) => setTimeout(resolve, 800));

        try {
            const res = await fetch(`${api.baseURL}/chat`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({message: input}),
            });

            const data = await res.json();
            const responseText = data.response || data.error || "No response";

            setIsLoading(false);
            await typeText(responseText);

            const aiMessage = {role: "assistant", text: responseText};
            setMessages((prev) => [...prev, aiMessage]);
            setStreamingText("");
            setTimeout(() => textareaRef.current?.focus(), 100);
        } catch (err) {
            console.error("Error chatting:", err);
            setIsLoading(false);

            const errorText = "[Error connecting to AI]";
            await typeText(errorText);

            setMessages((prev) => [...prev, {role: "assistant", text: errorText}]);
            setStreamingText("");
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    };

    return (
        <div className="chat-container">
            {/* Animated Background */}
            <div className="background-animation">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
                <div className="bg-gradient"></div>
                <div className="bg-grid"></div>
            </div>

            {/* Top Header */}
            <div className="top-header">
                <div className="top-header-content">
                    <div className="model-icon">
                        <Bot className="avatar-icon" size={100}/>
                    </div>
                    <h2 className="model-name">Jarvis 3.6</h2>
                </div>
            </div>

            {/* Messages Container */}
            <div className="messages-container">
                {messages.length === 0 && !isLoading && !isStreaming ? (
                    <div className="empty-state">
                        <div className="empty-state-content">
                            <div className="empty-state-icon">
                                <Bot className="bot-icon" size={60}/>
                            </div>
                            <h2>How can I help you today?</h2>
                            <p>Start a conversation with Jarvis 3.6</p>
                        </div>
                    </div>
                ) : (
                    <div className="messages-wrapper">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`message-row ${
                                    msg.role === "user" ? "message-row-user" : "message-row-ai"
                                }`}
                            >
                                <div
                                    className={`message-content ${
                                        msg.role === "user"
                                            ? "message-content-user"
                                            : "message-content-ai"
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`avatar ${
                                            msg.role === "user" ? "avatar-user" : "avatar-ai"
                                        }`}
                                    >
                                        {msg.role === "user" ? (
                                            <User className="avatar-icon"/>
                                        ) : (
                                            <Bot className="avatar-icon"/>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div
                                        className={`message-text-wrapper ${
                                            msg.role === "user"
                                                ? "message-text-right"
                                                : "message-text-left"
                                        }`}
                                    >
                                        <div
                                            className={`message-bubble ${
                                                msg.role === "user"
                                                    ? "message-bubble-user"
                                                    : "message-bubble-ai"
                                            }`}
                                        >
                                            <div className="message-text">{msg.text}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Thinking Animation */}
                        {isLoading && (
                            <div className="message-row message-row-ai">
                                <div className="message-content message-content-ai">
                                    <div className="avatar avatar-ai">
                                        <Bot className="avatar-icon"/>
                                    </div>
                                    <div className="message-text-wrapper message-text-left">
                                        <div className="message-bubble message-bubble-ai">
                                            <div className="loading-dots">
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                                <div className="dot"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Streaming Response */}
                        {isStreaming && streamingText && (
                            <div className="message-row message-row-ai">
                                <div className="message-content message-content-ai">
                                    <div className="avatar avatar-ai">
                                        <Bot className="avatar-icon"/>
                                    </div>
                                    <div className="message-text-wrapper message-text-left">
                                        <div className="message-bubble message-bubble-ai">
                                            <div className="message-text">
                                                {streamingText}
                                                <span className="typing-cursor">|</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef}/>
                    </div>
                )}
            </div>

            {/* Input Container */}
            <div className="input-container">
                <div className="input-wrapper">
                    <div className="input-flex">
                        <div className="textarea-container">
              <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                      }
                  }}
                  placeholder="Message Jarvis 3.6..."
                  className="chat-textarea"
                  rows="1"
              />
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!input.trim() || isLoading || isStreaming}
                            className={`send-button ${
                                input.trim() && !isLoading && !isStreaming
                                    ? "send-button-active"
                                    : "send-button-disabled"
                            }`}
                        >
                            <svg
                                className="send-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
