import { detectIntent, Intent, getIntentAction } from "./intents";
import { findResponse } from "./knowledge";

export interface NexoraResponse {
  text: string;
  action?: {
    type: string; // e.g., "FIND_MY_BEST_HOUSE"
    label?: string;
    payload?: any;
  };
}

export function processMessage(input: string): NexoraResponse {
  // 1. Check knowledge base
  const knowledgeResult = findResponse(input);
  if (knowledgeResult) {
    return { text: knowledgeResult };
  }

  // 2. Detect intent
  const intent = detectIntent(input);

  // 3. If accommodation intent, route to action
  const action = getIntentAction(intent);
  if (action) {
    return {
      text: action.message,
      action: { type: action.action, label: "Find My Best House" },
    };
  }

  // 4. Special fallback for unknown questions
  if (intent === Intent.UNKNOWN) {
    return {
      text: "Hmm, I'm not sure about that. 🤔 I can help with UniStay-related questions like accommodation, bookings, payments, and verification. If you need immediate help, you can call us on +260 0771319817. 😊",
    };
  }

  // 5. Generic fallback
  return {
    text: "I've understood your question. Would you like me to guide you further? Or you can try the 'Find My Best House' tool for personalised recommendations.",
  };
}