/**
 * Nexora Knowledge Base – UniStayZM Assistant
 * Humanized, warm, and Zambian-friendly responses.
 */
export interface KnowledgeEntry {
  patterns: string[];
  response: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // ==========================================================
  // 1. GREETINGS / CONVERSATIONAL NICETIES
  // ==========================================================
  {
    patterns: [
      "hi", "hello", "hey", "hey there", "good morning", "good afternoon",
      "good evening", "yo", "sup", "howzit", "muli bwanji", "greetings",
      "hiya", "hello there", "morning", "evening",
    ],
    response:
      "Muli bwanji! 👋 I'm Nexora, your UniStay assistant. I'm here to help you find a room, book a bed space, or answer any questions about the platform. What can I do for you today? 😊",
  },
  {
    patterns: [
      "how are you", "how's it going", "how are you doing", "you good",
      "you okay", "how do you do", "what's up",
    ],
    response:
      "I'm doing great, thanks for asking! 😊 Ready to help you sort out your accommodation. What are you looking for today?",
  },
  {
    patterns: [
      "thank you", "thanks", "thank you so much", "appreciate it",
      "thanks a lot", "much appreciated", "thx", "tanki", "cheers",
      "thank u", "great thanks",
    ],
    response:
      "You're very welcome! 🙌 Happy to help. Anything else I can do for you? I'm here all day. 😊",
  },
  {
    patterns: [
      "bye", "goodbye", "see you", "see you later", "chat later", "later",
      "gotta go", "talk soon", "farewell", "catch you later", "bye bye",
    ],
    response:
      "Take care! 👋 Come back anytime you need help finding a place or managing your booking. Good luck with your search! 🏠✨",
  },
  {
    patterns: [
      "who are you", "what is your name", "what's your name", "your name",
      "are you a bot", "are you human", "are you real", "are you ai",
    ],
    response:
      "I'm Nexora, the friendly AI assistant built for UniStayZM! 🤖 I'm here to answer your questions about finding and booking student accommodation. Think of me as your campus housing buddy. 😄",
  },
  {
    patterns: [
      "lol", "haha", "nice one", "cool", "okay cool", "alright", "sounds good",
      "got it", "makes sense", "i see", "understood",
    ],
    response:
      "Glad that helps! 😊 Anything else you'd like to ask? Don't be shy – I'm here for you.",
  },

  // ==========================================================
  // 2. ABOUT UNISTAY
  // ==========================================================
  {
    patterns: [
      "what is unistay", "what does unistay do", "tell me about unistay",
      "explain unistay", "what is this platform", "what is unistayzm",
      "what is this app", "what is this website",
    ],
    response:
      "UniStayZM is a student accommodation platform built to help university students in Zambia find, compare, and book boarding houses near their campus. 🏠 You can browse verified listings, filter by budget and distance, request a bed space, and pay a small agent fee to confirm your booking. Want to know how to get started? I can guide you. 😊",
  },
  {
    patterns: [
      "is it free", "is unistay free", "does it cost money to use",
      "do i pay to browse", "is browsing free", "free to use",
    ],
    response:
      "Browsing and searching for accommodation on UniStay is completely free! 🎉 You only pay a small agent fee once you actually book a bed space. Want to see how booking works? Let me walk you through it.",
  },
  {
    patterns: [
      "who owns unistay", "who created unistay", "who made this",
      "who runs unistay", "who is behind unistay", "who founded unistay",
      "nexora backstory", "who is nexora", "about nexora tech",
    ],
    response:
      "UniStayZM is built by Nexora Tech, co-founded by Busenga Richard 🇿🇲, with a mission to make university life easier, smarter, and more connected for students in Zambia. UniStay is just the beginning – Nexora is building tools to make campus life better. 😊",
  },
  {
    patterns: [
      "where is unistay based", "which university", "what universities",
      "does unistay cover my university", "is unistay in my school",
      "which campus", "supported universities",
    ],
    response:
      "UniStay currently focuses on Mukuba University 🏛️, with plans to expand to more campuses across Zambia soon. If you're at Mukuba, you're all set to browse and book! 🚀",
  },
  {
    patterns: [
      "how does unistay work", "how does this work", "how do i use unistay",
      "explain how it works", "getting started",
    ],
    response:
      "It's super simple! 😊 1) Sign up as a student, 2) Browse or use 'Find My Best House' to get matched with properties, 3) Request a bed space you like, 4) Pay the agent fee once the landlord approves, 5) Get your booking confirmation with a QR code. Want me to walk you through any of these steps?",
  },

  // ==========================================================
  // 3. FINDING ACCOMMODATION
  // ==========================================================
  {
    patterns: [
      "how do i find a room", "how to find accommodation", "find a house",
      "looking for a room", "i need a place to stay", "search for rooms",
      "browse properties", "how to search listings", "find boarding house",
      "i need accommodation",
    ],
    response:
      "You can browse all available listings right from the homepage 🏠 – filter by price, location, and amenities to narrow things down. Or, if you'd rather get personalised suggestions, try 'Find My Best House' and I'll help match you with the best options. Which would you prefer? 😊",
  },
  {
    patterns: [
      "how does find my best house work", "find my best house",
      "smart recommendation", "recommendation tool", "best house for me",
      "match me with a house", "help me choose a house",
    ],
    response:
      "Find My Best House is like having a personal housing advisor! 🧭 It asks a few quick questions about your budget, how far you're willing to walk to campus, and what amenities matter most to you (like water, electricity, or security). Based on your answers, it ranks properties that best fit your needs. Want to try it now? 😊",
  },
  {
    patterns: [
      "can i browse without logging in", "do i need an account to search",
      "browse without signing up", "view listings without account",
      "do i have to sign up to look",
    ],
    response:
      "Yes! You can browse listings without an account. 👀 You'll only need to sign up when you're ready to request a bed space or save your preferences. No pressure, just browsing. 😊",
  },
  {
    patterns: [
      "how do i filter properties", "how to filter listings",
      "filter by price", "filter by location", "narrow down search",
      "sort listings", "filter options",
    ],
    response:
      "On the listings page, you can filter by price range, location/distance from campus, and available amenities. 🔍 This helps you quickly find properties that match your budget and priorities. Give it a try and let me know if you get stuck! 😊",
  },
  {
    patterns: [
      "how much does accommodation cost", "average rent", "price range",
      "how much is rent", "cheapest rooms", "affordable housing",
    ],
    response:
      "Prices vary by property, location, and amenities – you'll see the exact monthly or termly price listed on each property card. 💰 Use the price filter to only see options within your budget. Want help narrowing it down? I'm here! 😊",
  },

  // ==========================================================
  // 4. BOOKING PROCESS
  // ==========================================================
  {
    patterns: [
      "how do i book a bed", "how to book", "how to request a bed",
      "book accommodation", "reserve a room", "how do i reserve a bed space",
      "make a booking", "booking process",
    ],
    response:
      "Open the property you like, choose an available bed space, and tap 'Request Bed'. 🛏️ The landlord will then review your request. Once approved, you'll pay the agent fee to confirm your spot. Want to know what happens after you request? Let me explain. 😊",
  },
  {
    patterns: [
      "what happens after i request", "after requesting a bed",
      "what happens next after booking", "after i send a request",
      "then what happens",
    ],
    response:
      "Once you send a request, the landlord reviews it and either approves or rejects it. ✅ If approved, you'll get a notification asking you to pay the K100 agent fee. After payment is confirmed, you'll receive your booking confirmation with a QR code. 🎉 Anything else you'd like to know about the process?",
  },
  {
    patterns: [
      "how long does approval take", "how long until landlord responds",
      "how fast is approval", "response time for booking",
      "when will i know if approved",
    ],
    response:
      "Approval times depend on the landlord, but most respond within a day or two. ⏳ You'll see the status update in your dashboard as soon as they act on your request. Want me to explain how to check your booking status? 😊",
  },
  {
    patterns: [
      "can i cancel my booking", "how to cancel a booking", "cancel request",
      "i want to cancel", "undo my booking", "delete my booking",
    ],
    response:
      "Yes, you can cancel a confirmed booking from your student dashboard. 🗑️ Just find the booking and use the delete option. Keep in mind this permanently removes the booking record, so make sure you're certain before confirming.",
  },
  {
    patterns: [
      "what if the landlord rejects me", "landlord rejected my request",
      "my booking was rejected", "request denied", "what if i get rejected",
    ],
    response:
      "No worries – if a landlord rejects your request, the bed space simply becomes available again for other students, and you're free to request a different property. 😊 Your agent fee is only charged after approval, so you won't lose anything.",
  },
  {
    patterns: [
      "how do i know if i'm booked", "check my booking status",
      "is my booking confirmed", "booking confirmation", "did my booking go through",
      "status of my request",
    ],
    response:
      "You can check your booking status anytime from your student dashboard – it'll show as Requested, Approved, or Confirmed. 📋 Once confirmed, you'll also get a confirmation with a QR code as proof of your booking. Easy, right? 😊",
  },
  {
    patterns: [
      "can i book more than one room", "multiple bookings", "book two rooms",
      "can i have two bookings",
    ],
    response:
      "You can technically request multiple bed spaces, but we'd recommend only paying the agent fee once you're sure about a property, since the fee confirms your specific booking. 💡 Need help comparing a few options first? I'm here! 😊",
  },

  // ==========================================================
  // 5. PAYMENTS
  // ==========================================================
  {
    patterns: [
      "how much is the agent fee", "what is the agent fee for", "agent fee amount",
      "how much do i pay", "booking fee amount", "cost of booking",
    ],
    response:
      "The agent fee is K100 per booking – it covers helping connect you with a verified landlord and confirming your bed space. 💰 Want to know how to pay it? Let me explain. 😊",
  },
  {
    patterns: [
      "how to pay", "how do i pay", "payment", "mobile money", "how to pay agent fee",
      "where to send money", "payment process", "pay agent fee", "booking fee",
      "how do i send payment", "payment instructions", "how to make payment",
    ],
    response:
      "Once your booking is approved, you'll be shown instructions to pay the K100 agent fee via Mobile Money to +260 0771319817. 📱💸 After you've paid, an admin will confirm your payment and you'll receive your booking confirmation with a QR code. Anything else I can help with? 😊",
  },
  {
    patterns: [
      "can i pay later", "delay payment", "pay after moving in",
      "can i pay in installments", "pay in parts", "split payment",
    ],
    response:
      "The agent fee needs to be paid to confirm your booking and secure your bed space – until it's paid, the space stays available to other students. ⏳ If you're facing a genuine issue, reach out to support at +260 0771319817 to discuss your situation. 😊",
  },
  {
    patterns: [
      "what if i don't have mobile money", "no mobile money", "alternative payment",
      "other payment methods", "i don't have a mobile money account",
    ],
    response:
      "Currently, Mobile Money is the main way to pay the agent fee on UniStay. 📱 If you don't have an account, you can ask a friend or family member to send the payment on your behalf, or contact support at +260 0771319817 for help. 😊",
  },
  {
    patterns: [
      "is the payment secure", "is it safe to pay", "payment security",
      "will i get scammed", "is my money safe",
    ],
    response:
      "Yes – payments go directly to our verified Mobile Money number, and every payment is manually confirmed by an admin before your booking is finalized. 🔒 If anything ever looks off, contact support immediately at +260 0771319817. 😊",
  },
  {
    patterns: [
      "do i pay the landlord directly", "pay landlord", "who do i pay",
      "does the landlord get the fee",
    ],
    response:
      "No – the K100 agent fee is paid to UniStay's Mobile Money number, not directly to the landlord. 💰 Rent itself (the monthly/termly amount) is arranged separately between you and the landlord once you move in. 😊",
  },
  {
    patterns: [
      "what happens after i pay", "after payment", "i paid, now what",
      "payment confirmation", "i sent the money now what",
    ],
    response:
      "After you pay, our admin team verifies the payment and marks your booking as confirmed. ✅ You'll then get access to your booking confirmation with a QR code, which serves as proof of your reservation. This usually happens quickly, so check your dashboard. 😊",
  },
  {
    patterns: [
      "i paid but it's not showing", "payment not confirmed", "my payment isn't reflecting",
      "paid but still pending", "payment stuck",
    ],
    response:
      "If you've paid but it's not reflecting yet, it may just be waiting on admin confirmation. ⏳ If it's been a while, please contact support directly at +260 0771319817 with your payment details so they can look into it right away. 😊",
  },
  {
    patterns: [
      "is there a refund", "can i get my money back", "refund policy",
      "get a refund", "money back",
    ],
    response:
      "For refund requests, please reach out directly to support at +260 0771319817 – they'll review your specific situation and let you know the next steps. 😊",
  },

  // ==========================================================
  // 6. LANDLORDS & LISTINGS
  // ==========================================================
  {
    patterns: [
      "how do i become a landlord", "sign up as landlord", "list my property",
      "become a landlord", "register as landlord", "i want to list my house",
    ],
    response:
      "To list your property, sign up on UniStay and select the landlord role. 🏠 Once your account is set up, you can add your property details, bed spaces, and photos from your landlord dashboard. Want help with the next step? 😊",
  },
  {
    patterns: [
      "how to add a listing", "add a property", "create a listing",
      "list a new property", "post my boarding house",
    ],
    response:
      "From your landlord dashboard, click 'Add Listing' and fill in your property details – title, location, price, amenities, and bed spaces. 📝 Once submitted, it'll appear for students to browse and book. Easy, right? 😊",
  },
  {
    patterns: [
      "how to edit a listing", "update my listing", "change property details",
      "edit property", "modify my listing",
    ],
    response:
      "Go to your landlord dashboard, find the listing you want to change under 'Listings', and click the edit (pencil) icon. ✏️ You can update price, details, or bed space availability there. 😊",
  },
  {
    patterns: [
      "how to delete a listing", "remove a listing", "delete my property",
      "take down a listing",
    ],
    response:
      "In your landlord dashboard, find the listing under 'Listings' and click the delete (trash) icon. 🗑️ Keep in mind this action can't be undone, so make sure you're ready to remove it permanently.",
  },
  {
    patterns: [
      "how to manage bookings", "landlord manage requests", "view my bookings landlord",
      "landlord dashboard bookings", "see who booked my property",
    ],
    response:
      "Your landlord dashboard has a 'Bookings' tab showing all requests and confirmed bookings for your properties, along with student details and status. 📋 You can approve or reject pending requests right from there. 😊",
  },
  {
    patterns: [
      "how do i approve a request", "approve booking landlord",
      "accept a student's request", "confirm a booking as landlord",
    ],
    response:
      "In your landlord dashboard, go to the 'Requests' tab, find the student's request, and click 'Approve'. ✅ This reserves the bed space for them and notifies the student to proceed with the agent fee payment. 😊",
  },
  {
    patterns: [
      "can i reject a request", "how to reject a booking", "decline a student",
      "turn down a request",
    ],
    response:
      "Yes – in the 'Requests' tab of your landlord dashboard, click 'Reject' on any request you'd like to decline. ❌ The bed space will remain available for other students to request. 😊",
  },
  {
    patterns: [
      "how many listings can i add", "listing limit", "how many properties",
      "max number of listings",
    ],
    response:
      "There's currently no strict limit on how many properties you can list as a landlord – feel free to add all your available boarding houses. 🏠 If you run into any issues, reach out to support. 😊",
  },

  // ==========================================================
  // 7. SAFETY & VERIFICATION
  // ==========================================================
  {
    patterns: [
      "are listings verified", "is unistay safe", "how do you verify properties",
      "are the houses real", "is this legit", "trustworthy platform",
    ],
    response:
      "We take safety seriously – landlords go through our onboarding process, and bookings are only confirmed once payment is verified by our admin team. 🛡️ That said, we always recommend visiting the property or asking questions before finalizing your decision. 😊",
  },
  {
    patterns: [
      "what is the qr code for", "qr code purpose", "why do i get a qr code",
      "what does the qr code do",
    ],
    response:
      "Your booking QR code is proof of your confirmed reservation. 📱 Landlords or admins can scan it to instantly verify that your booking is legitimate and confirmed – handy for move-in day. 😊",
  },
  {
    patterns: [
      "how do i know the house is real", "is the property real",
      "fake listing", "how to avoid scams",
    ],
    response:
      "All listings go through our landlord onboarding process, but we still recommend asking the landlord questions and, where possible, visiting the property before paying. 🔍 If something feels off, contact support at +260 0771319817. 😊",
  },
  {
    patterns: [
      "what if the house doesn't match the photos", "photos don't match",
      "property looks different in person", "misleading listing",
    ],
    response:
      "If a property doesn't match its listing, please report it to support immediately at +260 0771319817 so we can investigate and take action with the landlord. 📸",
  },
  {
    patterns: [
      "is my personal information safe", "data privacy", "is my data secure",
      "privacy policy",
    ],
    response:
      "We only collect the information needed to help match you with accommodation and process bookings – like your name, student ID, and contact details. 🔒 Your information isn't shared with anyone outside the booking process. 😊",
  },

  // ==========================================================
  // 8. ACCOUNT HELP
  // ==========================================================
  {
    patterns: [
      "how do i reset my password", "forgot my password", "i forgot my password",
      "reset password", "can't remember password", "password reset",
    ],
    response:
      "On the login page, click 'Forgot Password' and follow the instructions sent to your email to reset it. 📧 If you don't receive an email, check your spam folder or contact support. 😊",
  },
  {
    patterns: [
      "how to change my email", "update my email", "change email address",
      "edit my account email",
    ],
    response:
      "You can update your email and other profile details from your Profile & Settings page in your dashboard. ✏️ If you run into trouble, reach out to support at +260 0771319817. 😊",
  },
  {
    patterns: [
      "how to delete my account", "delete account", "remove my account",
      "close my account", "deactivate account",
    ],
    response:
      "You can delete your account from the Profile & Settings page in your dashboard – just note this action is permanent. ⚠️ If you're having second thoughts or issues, feel free to reach out to support first. 😊",
  },
  {
    patterns: [
      "login issues", "i can't log in", "login not working", "trouble logging in",
      "can't sign in", "login error",
    ],
    response:
      "Double-check your email and password are correct, and make sure you're using the same login method you signed up with. 🔑 If you're still stuck, try resetting your password, or contact support for help. 😊",
  },
  {
    patterns: [
      "sign up help", "how do i sign up", "create an account", "register account",
      "how to make an account",
    ],
    response:
      "Click 'Sign Up', choose whether you're a student or landlord, and fill in your details – for students, that includes your student ID and university. 📝 Once submitted, you're ready to browse or list properties! 🎉",
  },
  {
    patterns: [
      "how do i update my profile", "edit my profile", "change my phone number",
      "update contact details",
    ],
    response:
      "Head to Profile & Settings in your dashboard to update your phone number, name, or other details. 📱 Landlords especially should keep their phone number updated so students can reach them after booking. 😊",
  },

  // ==========================================================
  // 9. FIND MY BEST HOUSE (RECOMMENDATION TOOL)
  // ==========================================================
  {
    patterns: [
      "how does the recommendation work", "what are the preferences",
      "recommendation criteria", "how does matching work",
    ],
    response:
      "Find My Best House considers your budget, how far you're willing to walk to campus, and the amenities you care about most (like water, electricity, or security), then ranks properties by how well they match. 🧭 Want to try it? I'll guide you! 😊",
  },
  {
    patterns: [
      "can i change my preferences", "update my preferences", "redo the quiz",
      "change my answers", "retake find my best house",
    ],
    response:
      "Yes, you can run 'Find My Best House' again anytime if your priorities change – just answer the questions fresh and you'll get updated recommendations. 🔄 Easy, right? 😊",
  },
  {
    patterns: [
      "how accurate is the match score", "match score meaning",
      "what does match percentage mean", "how is the score calculated",
    ],
    response:
      "The match score reflects how closely a property fits the preferences you gave – budget, distance, and amenities. 📊 A higher score means a closer match to what you're looking for, but we always recommend reviewing the full listing too. 😊",
  },
  {
    patterns: [
      "why was this property recommended", "why did i get this suggestion",
      "reason for recommendation",
    ],
    response:
      "Properties are recommended based on how well they align with the budget, distance, and amenities you selected. 🧭 If a suggestion doesn't feel right, you can adjust your preferences and try again. 😊",
  },

  // ==========================================================
  // 10. GENERAL HELP & SUPPORT
  // ==========================================================
  {
    patterns: [
      "contact support", "help", "i need assistance", "customer care",
      "how to reach someone", "support phone number", "support email",
      "talk to a human", "speak to support", "need help",
    ],
    response:
      "You can reach UniStay support directly at +260 0771319817. 📞 They're happy to help with anything I can't answer here. Is there something specific I can try to help with first? 😊",
  },
  {
    patterns: [
      "i have a complaint", "i want to report something", "file a complaint",
      "report an issue", "something is wrong",
    ],
    response:
      "I'm sorry to hear that. 😔 Please contact support directly at +260 0771319817 with the details, and they'll look into it right away. Thank you for letting us know. 😊",
  },
  {
    patterns: [
      "is there a mobile app", "do you have an app", "app download",
      "unistay app",
    ],
    response:
      "Right now, UniStay works directly through your web browser – no app download needed. 🌐 You can access it from your phone or computer anytime. 😊",
  },

  // ==========================================================
  // 11. FALLBACK / UNKNOWN QUESTIONS
  // ==========================================================
  {
    patterns: [
      "i don't know", "i'm not sure", "random question", "not about unistay",
      "this is off topic", "unrelated question", "something else",
    ],
    response:
      "I'm not sure about that. 🤔 You can contact support on +260 0771319817 for more specific help. Is there anything about UniStay I can help you with instead? 😊",
  },

  // ==========================================================
  // 12. MAP & LOCATION
  // ==========================================================
  {
    patterns: [
      "how do i see the property location", "property map", "where is the property",
      "view location on map", "see the location",
    ],
    response:
      "Each property page includes an interactive map showing exactly where it's located relative to campus. 🗺️ Just scroll to the location section on the listing to view it. 😊",
  },
  {
    patterns: [
      "what is the map for", "purpose of the map", "why is there a map",
    ],
    response:
      "The map helps you understand exactly how far a property is from campus and what's nearby, so you can make a more informed decision before booking. 📍 Helpful, right? 😊",
  },
  {
    patterns: [
      "can i get directions to the property", "directions to the house",
      "how do i get there", "navigate to property",
    ],
    response:
      "You can use the map on the property page to see its exact location, then open it in your preferred maps app for turn-by-turn directions. 🧭 Simple and easy! 😊",
  },
  {
    patterns: [
      "how do i know if it's near campus", "distance from campus",
      "how far is it from school", "walking distance to university",
    ],
    response:
      "Each listing shows its distance from campus, and you can also filter properties by walking distance using 'Find My Best House' or the search filters. 🚶 Want help finding something close by? Let me know! 😊",
  },
];

export function findResponse(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const entry of knowledgeBase) {
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return entry.response;
      }
    }
  }
  return null;
}