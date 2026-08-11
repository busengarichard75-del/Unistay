export enum Intent {
  GREETING = "GREETING",
  WHAT_IS_UNISTAY = "WHAT_IS_UNISTAY",
  FIND_ACCOMMODATION = "FIND_ACCOMMODATION",
  BOOKING_HELP = "BOOKING_HELP",
  PAYMENT_HELP = "PAYMENT_HELP",
  LANDLORD_HELP = "LANDLORD_HELP",
  VERIFICATION_HELP = "VERIFICATION_HELP",
  SAFETY_HELP = "SAFETY_HELP",
  ACCOUNT_HELP = "ACCOUNT_HELP",
  GENERAL_HELP = "GENERAL_HELP",
  UNKNOWN = "UNKNOWN",
}

interface IntentPattern {
  intent: Intent;
  patterns: string[];
}

const intentPatterns: IntentPattern[] = [
  {
    intent: Intent.GREETING,
    patterns: [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "howdy",
      "muli bwanji",
      "yewo",
      "moni",
    ],
  },
  {
    intent: Intent.WHAT_IS_UNISTAY,
    patterns: [
      "what is unistay",
      "what is unistayzm",
      "about unistay",
      "what does unistay do",
      "unistay meaning",
    ],
  },
  {
    intent: Intent.FIND_ACCOMMODATION,
    patterns: [
      "find accommodation",
      "accommodation near me",
      "help me find a room",
      "find a place",
      "looking for a room",
      "need a room",
      "where can i stay",
      "room near campus",
      "student housing",
      "accommodation for students",
      "boarding house",
      "find house",
      "need a house",
      "need somewhere to stay",
      "find boarding",
      "where to stay",
      "accommodation around",
    ],
  },
  {
    intent: Intent.BOOKING_HELP,
    patterns: [
      "how to book",
      "booking process",
      "how do i book",
      "how to request a bed",
      "book a room",
      "booking issues",
      "how to reserve",
      "request a bed",
      "booking steps",
    ],
  },
  {
    intent: Intent.PAYMENT_HELP,
    patterns: [
      "how much is agent fee",
      "agent fee",
      "how much to pay",
      "booking fee",
      "payment fee",
      "how to pay",
      "payment method",
      "pay agent fee",
      "pay",
      "payment",
      "money",
      "send money",
      "mobile money",
      "where to pay",
      "payment process",
      "pay for booking",
      "fee",
    ],
  },
  {
    intent: Intent.LANDLORD_HELP,
    patterns: [
      "how to become landlord",
      "list my property",
      "add listing",
      "how to add property",
      "become a landlord",
      "list my house",
      "landlord sign up",
      "add my property",
      "register as landlord",
    ],
  },
  {
    intent: Intent.VERIFICATION_HELP,
    patterns: [
      "are listings verified",
      "verification",
      "is it safe",
      "trust",
      "verified badge",
      "how to verify",
      "secure",
      "scams",
      "fraud",
      "unistay safe",
    ],
  },
  {
    intent: Intent.SAFETY_HELP,
    patterns: ["safety", "secure", "scams", "fraud", "unistay safe", "is it safe"],
  },
  {
    intent: Intent.ACCOUNT_HELP,
    patterns: [
      "forgot password",
      "reset password",
      "can't log in",
      "account",
      "login issues",
      "password reset",
      "change password",
    ],
  },
  {
    intent: Intent.GENERAL_HELP,
    patterns: [
      "help",
      "support",
      "contact support",
      "need help",
      "customer care",
      "talk to someone",
      "assistance",
    ],
  },
];

export function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();
  for (const entry of intentPatterns) {
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern)) {
        return entry.intent;
      }
    }
  }
  return Intent.UNKNOWN;
}

export function getIntentAction(intent: Intent): { action: string; message: string } | null {
  if (intent === Intent.FIND_ACCOMMODATION) {
    return {
      action: "FIND_MY_BEST_HOUSE",
      message:
        "I can help you find the best accommodation based on your preferences. Click the button below to get started! 🧭",
    };
  }
  return null;
}