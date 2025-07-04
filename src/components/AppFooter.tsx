"use client";

import { Github } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-8 sm:mt-12 py-4 border-t border-gray-200">
      <div className="flex items-center justify-center">
        <a
          href="https://github.com/arielbk/vjezbajmo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Github className="h-4 w-4" />
          See the code on GitHub
        </a>
      </div>
    </footer>
  );
}
