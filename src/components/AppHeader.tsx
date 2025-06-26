"use client";

import { SettingsModal } from "@/components/SettingsModal";
import Link from "next/link";

export function AppHeader() {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
        <span className="rounded-full bg-white inline-grid place-items-center w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-4xl">
          🇭🇷
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vježbajmo</h1>
          <p className="text-sm sm:text-base text-gray-500">Croatian Language Practice</p>
        </div>
      </Link>
      <SettingsModal />
    </div>
  );
}
