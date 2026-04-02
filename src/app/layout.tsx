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
  title: "Veyra — Faith in Your Learning",
  description:
    "Veyra turns your PDF notes into AI-generated flashcards and quizzes, tracks your performance, and surfaces exactly where you need to improve.",
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
