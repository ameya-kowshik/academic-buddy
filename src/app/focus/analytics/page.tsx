"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  AlertCircle,
  Plus,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import RecentCoachTips from "@/components/agents/RecentCoachTips";
import ProductivityAnalystDashboard from "@/components/agents/ProductivityAnalystDashboard";

// Hooks
import { useFocusSessions } from "@/hooks/useFocusSessions";

// Components
import OverviewAnalytics from "../../../components/analytics/OverviewAnalytics";
import DayAnalytics from "../../../components/analytics/DayAnalytics";
import WeekAnalytics from "../../../components/analytics/WeekAnalytics";
import MonthAnalytics from "../../../components/analytics/MonthAnalytics";
import YearAnalytics from "../../../components/analytics/YearAnalytics";

type SectionType = "analytics" | "ai-weekly-report";

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FocusAnalyticsPageContent() {
  const {
    sessions,
    tags,
    loading: sessionsLoading,
    error: sessionsError,
    clearError,
  } = useFocusSessions();

  const [activeSection, setActiveSection] = useState<SectionType>("analytics");
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Focus Analytics</h1>
              <p className="text-sm text-slate-400">Comprehensive productivity insights and trends</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/focus">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Session
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Error Display */}
        {sessionsError && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{sessionsError}</p>
                </div>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Navbar */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveSection("analytics")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeSection === "analytics"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveSection("ai-weekly-report")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeSection === "ai-weekly-report"
                ? "bg-violet-700 text-white shadow-sm shadow-violet-500/20"
                : "bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
            }`}
          >
            AI Weekly Report
          </button>
        </div>

        {/* Analytics Section */}
        {activeSection === "analytics" && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border border-slate-700/50">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="day"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Day
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="year"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Year
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <CollapsibleSection title="Overview">
                  <OverviewAnalytics sessions={sessions} tags={tags} loading={sessionsLoading} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="day" className="space-y-6">
                <CollapsibleSection title="Day">
                  <DayAnalytics sessions={sessions} tags={tags} loading={sessionsLoading} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="week" className="space-y-6">
                <CollapsibleSection title="Week">
                  <WeekAnalytics sessions={sessions} tags={tags} loading={sessionsLoading} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="month" className="space-y-6">
                <CollapsibleSection title="Month">
                  <MonthAnalytics sessions={sessions} tags={tags} loading={sessionsLoading} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="year" className="space-y-6">
                <CollapsibleSection title="Year">
                  <YearAnalytics sessions={sessions} tags={tags} loading={sessionsLoading} />
                </CollapsibleSection>
              </TabsContent>
            </Tabs>

            {/* Recent Coach Tips */}
            <section className="mt-10">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-100">
                      Recent Coach Tips
                    </CardTitle>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Personalized suggestions from your last focus sessions. Dismissed tips are hidden.
                  </p>
                </CardHeader>
                <CardContent>
                  <RecentCoachTips />
                </CardContent>
              </Card>
            </section>
          </div>
        )}

        {/* AI Weekly Report Section */}
        {activeSection === "ai-weekly-report" && (
          <div>
            <ProductivityAnalystDashboard />
          </div>
        )}
      </main>
    </div>
  );
}

export default function FocusAnalyticsPage() {
  return (
    <AppLayout>
      <FocusAnalyticsPageContent />
    </AppLayout>
  );
}
