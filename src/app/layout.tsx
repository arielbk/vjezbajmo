import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
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
  return (
    <html lang="hr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ExerciseProvider>
          <div className="min-h-screen">
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
              <AppHeader />
              {children}
              <AppFooter />
            </div>
          </div>
        </ExerciseProvider>
      </body>
    </html>
  );
}
