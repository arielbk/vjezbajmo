"use client";

import { SettingsModal } from "@/components/SettingsModal";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1">
        <span className="rounded-full bg-white inline-grid place-items-center w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-4xl flex-shrink-0">
          🇭🇷
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">Vježbajmo</h1>
          <p className="text-xs sm:text-base text-gray-500 truncate">Croatian Language Practice</p>
        </div>
      </Link>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <SettingsModal />
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0 min-w-0">
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 sm:w-9 sm:h-9"
              }
            }}
          />
        </SignedIn>
      </div>
    </div>
  );
}
