"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;  // The URL or text to encode
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export function QRCodeDisplay({
  value,
  size = 128,
  bgColor = "#ffffff",
  fgColor = "#000000",
}: QRCodeDisplayProps) {
  return (
    <div className="inline-block p-2 bg-white rounded-lg shadow-sm">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="H" // High error correction
        includeMargin
      />
    </div>
  );
}