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
  Target
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

// Hooks
import { useFocusSessions } from "@/hooks/useFocusSessions";

// Components
import OverviewAnalytics from "../../../components/analytics/OverviewAnalytics";
import DayAnalytics from "../../../components/analytics/DayAnalytics";
import WeekAnalytics from "../../../components/analytics/WeekAnalytics";
import MonthAnalytics from "../../../components/analytics/MonthAnalytics";
import YearAnalytics from "../../../components/analytics/YearAnalytics";

function FocusAnalyticsPageContent() {
  
  // Data hooks
  const {
    sessions,
    tags,
    loading: sessionsLoading,
    error: sessionsError,
    clearError
  } = useFocusSessions();

  // State
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
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Session
              </Button>
            </Link>
            
            <Link href="/focus/history">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Session List
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

        {/* Analytics Tabs */}
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

          {/* Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewAnalytics 
              sessions={sessions} 
              tags={tags} 
              loading={sessionsLoading} 
            />
          </TabsContent>

          <TabsContent value="day" className="space-y-6">
            <DayAnalytics 
              sessions={sessions} 
              tags={tags} 
              loading={sessionsLoading} 
            />
          </TabsContent>

          <TabsContent value="week" className="space-y-6">
            <WeekAnalytics 
              sessions={sessions} 
              tags={tags} 
              loading={sessionsLoading} 
            />
          </TabsContent>

          <TabsContent value="month" className="space-y-6">
            <MonthAnalytics 
              sessions={sessions} 
              tags={tags} 
              loading={sessionsLoading} 
            />
          </TabsContent>

          <TabsContent value="year" className="space-y-6">
            <YearAnalytics 
              sessions={sessions} 
              tags={tags} 
              loading={sessionsLoading} 
            />
          </TabsContent>
        </Tabs>
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