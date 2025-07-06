"use client";

import { SettingsModal } from "@/components/SettingsModal";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
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
      
      <div className="flex items-center gap-3">
        <SettingsModal />
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
}
