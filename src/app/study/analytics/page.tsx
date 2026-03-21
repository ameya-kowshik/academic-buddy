"use client";

import AppLayout from "@/components/layout/AppLayout";
import StudyAnalyticsDashboard from "@/components/analytics/StudyAnalyticsDashboard";
import WeakAreasComponent from "@/components/analytics/WeakAreasComponent";
import QuizAttemptsHistory from "@/components/analytics/QuizAttemptsHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Study Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <StudyAnalyticsDashboard userId={user.uid} />
              </CardContent>
            </Card>

            <QuizAttemptsHistory userId={user.uid} limit={10} />

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <WeakAreasComponent userId={user.uid} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
