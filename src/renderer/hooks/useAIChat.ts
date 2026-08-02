import { useCallback, useEffect, useState } from "react";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    const history = await window.electron.ai.getHistory();
    setMessages(history || []);
  }, []);

  useEffect(() => {
    window.electron.ai.createConversation();
    reload();
  }, [reload]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setSending(true);
      try {
        await window.electron.ai.processMessage(trimmed);
        await reload();
      } finally {
        setSending(false);
      }
    },
    [reload],
  );

  const clear = useCallback(async () => {
    await window.electron.ai.clearHistory();
    setMessages([]);
  }, []);

  return { messages, sending, sendMessage, clear };
}
