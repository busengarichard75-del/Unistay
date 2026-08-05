"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href = "/" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600"
    >
      <ChevronLeft size={18} />
      Back
    </Link>
  );
}