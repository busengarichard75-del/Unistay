"use client";

import { useState, useEffect, useRef } from "react";

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
  const indexRef = useRef(0);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Update the ref whenever index changes
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setFade(true);

      // After 400ms, change text and fade in
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setFade(false);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-500 ease-in-out ${
        fade ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      {messages[index]}
    </span>
  );
}