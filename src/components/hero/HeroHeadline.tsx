"use client";

import { useState, useEffect } from "react";

const messages = [
  "Find your next Boarding house.",
  "Verified accommodation near your campus.",
  "Book a barber. Print your notes. Fix your phone.",
  "Buy and sell with students near you.",
  "Rooms, services, and deals — all in one place.",
  "Your campus, all in one place.",
  "Stop searching. Start settling in.",
  "The right place. The right price.",
  "Let Peza find your best match.",
  "Everything a student needs, close to campus."
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
    }, 4500);

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