import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { AppHeader } from "@/components/AppHeader";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import "./globals.css";
import "../instrumentation-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vježbajmo Hrvatski - Croatian Grammar Practice",
  description: "Practice Croatian grammar with dynamic exercises",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#eff6ff", // blue-50 for Safari status bar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Skip to content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ExerciseProvider>
          <div className="min-h-screen">
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
              <AppHeader />
              <main id="main-content" className="outline-none" tabIndex={-1}>
                {children}
              </main>
            </div>
          </div>
        </ExerciseProvider>
      </body>
    </html>
  );
}
