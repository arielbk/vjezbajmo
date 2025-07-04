"use client";

import { SettingsModal } from "@/components/SettingsModal";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between mb-4 sm:mb-6" role="banner">
      <Link 
        href="/" 
        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:rounded-md"
        aria-label="Vježbajmo - Return to home page"
      >
        <span 
          className="rounded-full bg-white inline-grid place-items-center w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-4xl"
          aria-hidden="true"
        >
          🇭🇷
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vježbajmo</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Croatian Language Practice</p>
        </div>
      </Link>
      <SettingsModal />
    </header>
  );
}
