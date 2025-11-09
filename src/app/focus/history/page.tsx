"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Timer, 
  BarChart3,
  AlertCircle,
  Plus,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  X
} from "lucide-react";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTasks } from "@/hooks/useTasks";

// Utils
import { focusUtils } from "@/lib/focus-utils";

export default function FocusHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Data hooks
  const {
    sessions,
    tags,
    loading: sessionsLoading,
    error: sessionsError,
    clearError
  } = useFocusSessions();
  
  const { tasks } = useTasks();

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("all");

  // Filter sessions based on current filters
  const filteredSessions = sessions.filter(session => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesNotes = session.notes?.toLowerCase().includes(searchLower);
      const matchesTask = getTaskName(session.taskId)?.toLowerCase().includes(searchLower);
      const matchesTag = tags.find(tag => tag.id === session.tagId)?.name.toLowerCase().includes(searchLower);
      
      if (!matchesNotes && !matchesTask && !matchesTag) {
        return false;
      }
    }

    // Tag filter
    if (filterTag !== "ALL" && session.tagId !== filterTag) {
      return false;
    }

    // Session type filter
    if (filterType !== "ALL" && session.sessionType !== filterType) {
      return false;
    }

    // Date range filter
    if (dateRange !== "all") {
      const sessionDate = new Date(session.startedAt);
      
      switch (dateRange) {
        case "today":
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (sessionDate < today || sessionDate >= tomorrow) return false;
          break;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (sessionDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (sessionDate < monthAgo) return false;
          break;
      }
    }

    return true;
  });

  // Calculate statistics from filtered sessions
  const stats = focusUtils.calculateStats(filteredSessions);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterTag("ALL");
    setFilterType("ALL");
    setDateRange("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterTag !== "ALL" || filterType !== "ALL" || dateRange !== "all";

  // Group filtered sessions by date
  const groupedSessions = focusUtils.groupSessionsByDate(focusUtils.sortSessionsByDate(filteredSessions));

  // Helper function to get task name
  const getTaskName = (taskId: string | null | undefined) => {
    if (!taskId) return null;
    const task = tasks.find(t => t.id === taskId);
    return task?.title || "Unknown Task";
  };

  // Helper function to get tag info
  const getTagInfo = (tagId: string | null | undefined) => {
    if (!tagId) return null;
    return tags.find(t => t.id === tagId) || null;
  };

  // Helper function to format date for grouping
  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/focus"
              className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Focus
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Focus Sessions History</h1>
                <p className="text-sm text-slate-400">Track your productivity patterns and progress</p>
              </div>
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

        <div className="space-y-8">
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sessions */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">
                      {sessionsLoading ? "..." : stats.totalSessions}
                    </p>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                  </div>
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Focus Time */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {sessionsLoading ? "..." : `${stats.totalHours}h`}
                    </p>
                    <p className="text-sm text-slate-400">Total Focus Time</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Focus Score */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-400">
                      {sessionsLoading ? "..." : stats.averageFocusScore > 0 ? stats.averageFocusScore.toFixed(1) : "N/A"}
                    </p>
                    <p className="text-sm text-slate-400">Avg Focus Score</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Session Length */}
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      {sessionsLoading ? "..." : focusUtils.formatDuration(stats.averageSessionLength)}
                    </p>
                    <p className="text-sm text-slate-400">Avg Session Length</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Controls */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filter Sessions
                </CardTitle>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-slate-300 placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                </div>

                {/* Tag Filter */}
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/20">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      All Tags
                    </SelectItem>
                    {tags.map((tag) => (
                      <SelectItem 
                        key={tag.id} 
                        value={tag.id}
                        className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Session Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/20">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      All Types
                    </SelectItem>
                    <SelectItem value="POMODORO" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      Pomodoro
                    </SelectItem>
                    <SelectItem value="STOPWATCH" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      Stopwatch
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/20">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      All Time
                    </SelectItem>
                    <SelectItem value="today" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      Today
                    </SelectItem>
                    <SelectItem value="week" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      This Week
                    </SelectItem>
                    <SelectItem value="month" className="text-slate-300 focus:bg-slate-700 focus:text-cyan-400">
                      This Month
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Results Summary */}
              {hasActiveFilters && (
                <div className="text-sm text-slate-400 pt-2 border-t border-slate-700">
                  Showing {filteredSessions.length} of {sessions.length} sessions
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session List - Placeholder */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-100">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {sessionsLoading ? (
                <div className="text-center text-slate-400">
                  <Timer className="w-8 h-8 mx-auto mb-4 animate-pulse" />
                  <p>Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No focus sessions yet</p>
                  <p className="text-sm">Start your first focus session to see your history here</p>
                  <Link href="/focus" className="mt-4 inline-block">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Focus Session
                    </Button>
                  </Link>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No sessions match your filters</p>
                  <p className="text-sm mb-4">Try adjusting your search criteria or clearing filters</p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSessions).map(([dateString, dateSessions]) => (
                    <div key={dateString}>
                      {/* Date Header */}
                      <div className="flex items-center mb-4">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        <h3 className="text-lg font-semibold text-slate-200">
                          {formatDateGroup(dateString)}
                        </h3>
                        <div className="ml-auto text-sm text-slate-400">
                          {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Sessions for this date */}
                      <div className="space-y-3">
                        {dateSessions.map((session) => {
                          const taskName = getTaskName(session.taskId);
                          const tagInfo = getTagInfo(session.tagId);
                          const sessionTypeColor = focusUtils.getSessionTypeColor(session.sessionType);
                          const focusScoreColor = session.focusScore ? focusUtils.getFocusScoreColor(session.focusScore) : '#64748b';

                          return (
                            <Card 
                              key={session.id} 
                              className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-300"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {/* Session Header */}
                                    <div className="flex items-center space-x-3 mb-2">
                                      {/* Session Type Badge */}
                                      <div 
                                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: sessionTypeColor }}
                                      >
                                        {session.sessionType}
                                      </div>

                                      {/* Duration */}
                                      <div className="flex items-center text-slate-300">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span className="font-medium">
                                          {focusUtils.formatDuration(session.duration)}
                                        </span>
                                      </div>

                                      {/* Time Range */}
                                      <div className="text-sm text-slate-400">
                                        {new Date(session.startedAt).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                        {session.completedAt && (
                                          <>
                                            {" - "}
                                            {new Date(session.completedAt).toLocaleTimeString('en-US', { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            })}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Task and Tag Info */}
                                    <div className="flex items-center space-x-4 mb-2">
                                      {taskName && (
                                        <div className="flex items-center text-sm text-slate-300">
                                          <Target className="w-4 h-4 mr-1 text-cyan-400" />
                                          <span>{taskName}</span>
                                        </div>
                                      )}

                                      {tagInfo && (
                                        <div className="flex items-center text-sm text-slate-300">
                                          <div 
                                            className="w-3 h-3 rounded-full mr-2" 
                                            style={{ backgroundColor: tagInfo.color || '#64748b' }}
                                          />
                                          <span>{tagInfo.name}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Notes */}
                                    {session.notes && (
                                      <div className="text-sm text-slate-400 bg-slate-900/30 rounded-md p-2 mt-2">
                                        {session.notes}
                                      </div>
                                    )}
                                  </div>

                                  {/* Focus Score */}
                                  {session.focusScore && (
                                    <div className="ml-4 text-center">
                                      <div 
                                        className="text-2xl font-bold mb-1"
                                        style={{ color: focusScoreColor }}
                                      >
                                        {session.focusScore}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        Focus Score
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}