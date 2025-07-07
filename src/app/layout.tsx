import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { DebugInfo } from "@/components/DebugInfo";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eff6ff", // blue-50 for Safari status bar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Handle missing Clerk publishable key gracefully for builds
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Clerk authentication will not work');
  }

  const AppContent = () => (
    <html lang="hr">
      <Analytics />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ExerciseProvider>
          <div className="min-h-screen">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
              <AppHeader />
              {children}
              <AppFooter />
            </div>
          </div>
          <DebugInfo />
        </ExerciseProvider>
        <Toaster
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if publishable key is available
  if (publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <AppContent />
      </ClerkProvider>
    );
  }

  // Fallback for builds without Clerk keys
  return <AppContent />;
}
