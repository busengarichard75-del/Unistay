"use client";

import { useState, useEffect, useRef } from "react";

const messages = [
  "Find your next Boarding house.",
  "Verified accommodation near your campus.",
  "The right place. The right price.",
  "Stop searching. Start settling in.",
  "Your next Boarding house is closer than you think.",
  "Let Peza find your best match.",
  "Accommodation that understands students."
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