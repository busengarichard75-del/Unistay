"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { processMessage, NexoraResponse } from "@/lib/nexora/controller";

interface Message {
  id: string;
  sender: "user" | "nexora";
  text: string;
  action?: {
    type: string;
    label: string;
  };
}

export function NexoraChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "nexora",
      text: "👋 Muli bwanji! I'm Peza Assistant, your accommodation helper. How can I help you find a place today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = { id: Date.now().toString(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const response: NexoraResponse = processMessage(trimmed);
      const nexoraMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "nexora",
        text: response.text,
        action: response.action
          ? {
              type: response.action.type,
              label: response.action.label || "Learn More",
            }
          : undefined,
      };
      setMessages((prev) => [...prev, nexoraMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleAction = (actionType: string) => {
    if (actionType === "FIND_MY_BEST_HOUSE") {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("openFindModal"));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[var(--nexora-primary)] p-4 text-white shadow-lg hover:bg-[var(--nexora-primary-hover)] transition-all"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="mb-4 w-80 max-w-[90vw] rounded-2xl bg-white shadow-xl flex flex-col h-96 overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between bg-[var(--nexora-navy)] px-4 py-3 text-white">
            <span className="font-semibold">💬 Peza Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.sender === "user"
                      ? "bg-[var(--nexora-primary)] text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  {msg.text}
                  {msg.action && (
                    <button
                      onClick={() => handleAction(msg.action!.type)}
                      className="mt-2 block rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-500">
                  ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-2 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--nexora-primary)]"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="rounded-full bg-[var(--nexora-primary)] p-1.5 text-white hover:bg-[var(--nexora-primary-hover)] transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}