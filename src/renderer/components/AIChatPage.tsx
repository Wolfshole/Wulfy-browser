import { useEffect, useRef, useState } from "react";
import { useAIChat } from "../hooks/useAIChat";

export default function AIChatPage() {
  const { messages, sending, sendMessage, clear } = useAIChat();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="ai-chat-page">
      <div className="ai-chat-header">
        <h2>🤖 Wulfy KI-Assistent</h2>
        <button className="small-btn" onClick={clear}>
          Verlauf leeren
        </button>
      </div>

      <div className="ai-chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="empty-message">
            Frag mich etwas zu Tabs, Favoriten, Verlauf, Downloads oder
            Einstellungen.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`ai-chat-message ai-chat-message-${msg.role}`}
          >
            <span className="ai-chat-bubble">{msg.content}</span>
          </div>
        ))}
        {sending && (
          <div className="ai-chat-message ai-chat-message-assistant">
            <span className="ai-chat-bubble ai-chat-bubble-typing">…</span>
          </div>
        )}
      </div>

      <div className="ai-chat-input-row">
        <input
          type="text"
          className="ai-chat-input"
          placeholder="Schreib eine Nachricht..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          className="ai-chat-send-btn"
          onClick={handleSend}
          disabled={sending}
        >
          Senden
        </button>
      </div>
    </div>
  );
}
