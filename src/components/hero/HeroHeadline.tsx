// src/components/hero/HeroHeadline.tsx
"use client";

import { useState, useEffect } from "react";

const messages = [
  "Find your next verified room near campus.",
  "Meet your next roommate or study partner.",
  "Book a barber. Print notes. Fix your phone.",
  "Buy and sell with students around you.",
  "Ace your exams with free study materials.",
  "Everything a student needs, in one place.",
  "Your entire campus life, simplified.",
  "Stop searching. Start settling in."
];

export function HeroHeadline() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Respect reduced motion: keep the first message, no rotation
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let swapTimeout: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      // Fade out
      setFade(true);

      // After 400ms, change text and fade in
      swapTimeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setFade(false);
      }, 400);
    }, 4500); // Changes every 4.5 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(swapTimeout);
    };
  }, []);

  return (
    <span
      className={`block min-h-[2.4em] transition-all duration-500 ease-in-out sm:min-h-[2em] ${
        fade ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      {messages[index]}
    </span>
  );
}