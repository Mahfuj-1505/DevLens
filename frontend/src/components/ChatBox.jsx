import React, {useState, useRef, useEffect} from "react";
import {User, Bot} from "lucide-react";
import "./ChatBox.css";
import {api} from "../api.js";
import ReactMarkdown from "react-markdown";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const controllerRef = useRef(null);
    const streamingCancelledRef = useRef(false);

    const scrollToBottom = () => {
        // scroll the messages container only (do not scroll the whole page)
        const container = messagesContainerRef.current;
        if (container) {
            try {
                container.scrollTo({top: container.scrollHeight, behavior: 'smooth'});
            } catch (e) {
                container.scrollTop = container.scrollHeight;
            }
        } else {
            messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
        }
    };

    useEffect(() => {
        scrollToBottom();
        const handleResize = () => {
            const container = messagesContainerRef.current;
            if (container) container.scrollTop = container.scrollHeight;
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [messages, streamingText]);

    const typeText = (text, delay = 10) => {
        return new Promise((resolve) => {
            setIsStreaming(true);
            streamingCancelledRef.current = false;
            setStreamingText("");
            let index = 0;

            const interval = setInterval(() => {
                // stop if aborted
                if (streamingCancelledRef.current || (controllerRef.current && controllerRef.current.signal && controllerRef.current.signal.aborted)) {
                    clearInterval(interval);
                    setIsStreaming(false);
                    resolve('aborted');
                    return;
                }

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
        if (e && e.preventDefault) e.preventDefault();
        if (!input.trim() || isLoading || isStreaming) return;

        const messageToSend = input;
        const userMessage = {role: "user", text: messageToSend};
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        setTimeout(() => textareaRef.current?.focus(), 0);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // create abort controller
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const backendBaseURL =
                window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                    ? api.baseURL
                    : `http://${window.location.hostname}:8000`;
            const res = await fetch(`${backendBaseURL}/chat`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({message: messageToSend}),
                signal: controller.signal,
            });

            const data = await res.json();
            const responseText = data.response || data.error || "No response";

            setIsLoading(false);
            const result = await typeText(responseText);

            if (result === 'aborted') {
                setStreamingText("");
                setMessages((prev) => [...prev, {role: 'assistant', text: '[Stopped]'}]);
            } else {
                const aiMessage = {role: "assistant", text: responseText};
                setMessages((prev) => [...prev, aiMessage]);
                setStreamingText("");
            }
        } catch (err) {
            if (err && err.name === 'AbortError') {
                setIsLoading(false);
                streamingCancelledRef.current = true;
                setStreamingText("");
                setMessages((prev) => [...prev, {role: 'assistant', text: '[Stopped]'}]);
            } else {
                console.error("Error chatting:", err);
                setIsLoading(false);
                await typeText("[Error connecting to AI]");
                setMessages((prev) => [...prev, {role: "assistant", text: "[Error connecting to AI]"}]);
                setStreamingText("");
            }
        } finally {
            controllerRef.current = null;
            setIsLoading(false);
            setIsStreaming(false);
            streamingCancelledRef.current = false;
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    };

    const handleStop = () => {
        if (controllerRef.current) {
            try {
                controllerRef.current.abort();
            } catch (e) {
                console.warn('abort failed', e);
            }
        }
        streamingCancelledRef.current = true;
        setIsLoading(false);
        setIsStreaming(false);
    };

    // autosize textarea so pasted long text is visible
    const autosize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        const max = parseInt(getComputedStyle(ta).maxHeight) || 200;
        const newH = Math.min(ta.scrollHeight, max);
        ta.style.height = newH + 'px';
        ta.style.overflowY = ta.scrollHeight > max ? 'auto' : 'hidden';
    };
    useEffect(() => {
        autosize();
    }, []);

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
            <div className="messages-container" ref={messagesContainerRef}>
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
                                            <div className="message-text">
                                                {msg.role === "assistant" ? (
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>

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
                  onChange={(e) => {
                      setInput(e.target.value);
                      autosize();
                  }}
                  onInput={() => autosize()}
                  onPaste={() => setTimeout(autosize, 0)}
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
                            onClick={(isLoading || isStreaming) ? handleStop : handleSubmit}
                            disabled={!input.trim() && !(isLoading || isStreaming)}
                            className={`send-button ${
                                (input.trim() && !isLoading && !isStreaming) || (isLoading || isStreaming)
                                    ? "send-button-active"
                                    : "send-button-disabled"
                            }`}
                        >
                            {isLoading || isStreaming ? 'Stop' : (
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
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
