"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { processMessage, NexoraResponse } from "@/lib/nexora/controller";
import { useAuth } from "@/lib/AuthContext";
import { logUnansweredQuestion } from "@/services/unansweredQuestionsService";

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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "nexora",
      text: "👋 Muli bwanji! I'm Nexora, your UniStay assistant. How can I help you find a place today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-nudge after 30 seconds (only if user hasn't interacted)
  useEffect(() => {
    if (hasInteracted) return;

    nudgeTimerRef.current = setTimeout(() => {
      setShowNudge(true);
    }, 30000);

    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [hasInteracted]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowNudge(false);
    setHasInteracted(true);
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setHasInteracted(true);
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }

    const userMessage: Message = { id: Date.now().toString(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const response: NexoraResponse = processMessage(trimmed);
      
      // ✅ If no match was found (fallback), log the unanswered question
      // We detect the fallback by checking if the response text contains the support number phrase
      // or if it's the generic "I'm not sure about that" message.
      // A more precise way: we could modify the controller to return a flag, but this works.
      const isFallback = response.text.includes("I'm not sure about that") || 
                         response.text.includes("contact support on +260 0771319817");
      
      if (isFallback && user) {
        // Fire and forget – don't await
        logUnansweredQuestion({
          message: trimmed,
          userId: user.uid,
          userEmail: user.email,
        }).catch((err) => console.error("Logging failed (should not happen):", err));
      }

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
      setShowNudge(false);
      window.dispatchEvent(new CustomEvent("openFindModal"));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`relative rounded-full bg-[var(--nexora-primary)] p-4 text-white shadow-lg hover:bg-[var(--nexora-primary-hover)] transition-all ${
            showNudge ? "animate-pulse ring-4 ring-blue-400 ring-opacity-50" : ""
          }`}
        >
          <MessageCircle size={24} />
          {showNudge && (
            <span className="absolute -top-1 -right-1 whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg animate-bounce">
              👋 Need help?
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="mb-4 w-80 max-w-[90vw] rounded-2xl bg-white shadow-xl flex flex-col h-96 overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between bg-[var(--nexora-navy)] px-4 py-3 text-white">
            <span className="font-semibold">💬 Nexora</span>
            <button onClick={handleClose} className="text-gray-300 hover:text-white">
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