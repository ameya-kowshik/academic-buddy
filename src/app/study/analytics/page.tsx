"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StudyAnalyticsDashboard from "@/components/analytics/StudyAnalyticsDashboard";
import WeakAreasComponent from "@/components/analytics/WeakAreasComponent";
import QuizAttemptsHistory from "@/components/analytics/QuizAttemptsHistory";
import StudyCompanionDashboard from "@/components/agents/StudyCompanionDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SectionType = "overview" | "quiz-history" | "study-companion";



function StudyAnalyticsContent({ userId }: { userId: string }) {
  const [activeSection, setActiveSection] = useState<SectionType>("overview");

  const navItems: { id: SectionType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "quiz-history", label: "Quiz History" },
    { id: "study-companion", label: "Study Companion" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Study Analytics</h1>
              <p className="text-sm text-slate-400">Track your learning progress</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Section Navbar */}
        <div className="flex gap-2 mb-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? item.id === "study-companion"
                    ? "bg-violet-700 text-white shadow-sm shadow-violet-500/20"
                    : "bg-slate-700 text-white shadow-sm"
                  : "bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Study Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <StudyAnalyticsDashboard userId={userId} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz History */}
        {activeSection === "quiz-history" && (
          <div className="space-y-6">
            <QuizAttemptsHistory userId={userId} limit={10} />
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <WeakAreasComponent userId={userId} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Study Companion */}
        {activeSection === "study-companion" && <StudyCompanionDashboard />}
      </main>
    </div>
  );
}

export default function StudyAnalyticsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400">Please log in to view analytics</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <StudyAnalyticsContent userId={user.uid} />
    </AppLayout>
  );
}
