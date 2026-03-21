import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Veyra - AI-Powered Study Companion",
  description:
    "Transform your study sessions with AI-powered task management, focus sessions, and study materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} font-sans`}>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <TimerProvider>
              <Suspense>{children}</Suspense>
            </TimerProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
