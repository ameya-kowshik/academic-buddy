"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Flame,
  Target,
  Clock,
  TrendingUp,
  Award,
  Settings,
  Camera,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Zap,
  BookOpen,
  Coffee,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ReflectionDashboard from "@/components/agents/ReflectionDashboard";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";

interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  topTag: string | null;
  focusScoreAverage: number;
  weeklyTrend: 'improving' | 'declining' | 'stable';
}

function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch analytics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const token = await user?.getIdToken();
        const response = await fetch('/api/profile/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data.analytics);
      } catch (err) {
        console.error('Error fetching stats:', err);
        if (err instanceof Error && !err.message.includes('No sessions')) {
          setError('Failed to load analytics');
        }
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Fetch email notification preference
  useEffect(() => {
    const fetchEmailPref = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEmailNotificationsEnabled(data.emailNotificationsEnabled ?? false);
        }
      } catch (err) {
        console.error('Error fetching email preference:', err);
      }
    };
    if (user) fetchEmailPref();
  }, [user]);

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    setEmailNotificationsEnabled(enabled);
    try {
      const token = await user?.getIdToken();
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailNotificationsEnabled: enabled }),
      });
    } catch (err) {
      console.error('Error saving email preference:', err);
      setEmailNotificationsEnabled(!enabled);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setError("");
      setSuccess("");

      // Validate inputs
      if (!formData.name.trim()) {
        setError("Name cannot be empty");
        return;
      }

      if (!formData.email.trim()) {
        setError("Email cannot be empty");
        return;
      }

      // In production, call API to update profile
      // await updateUserProfile(formData);

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.displayName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
    setError("");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="h-6 w-6 text-white" />
          </div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Profile</h1>
              <p className="text-sm text-slate-400">Manage your account settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Error Alert */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
                <Button
                  onClick={() => setError("")}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Alert */}
        {success && (
          <Card className="bg-emerald-500/10 border-emerald-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400">{success}</p>
                </div>
                <Button
                  onClick={() => setSuccess("")}
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25 relative group">
                    <User className="h-12 w-12 text-white" />
                    <button className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100 text-center">
                    {user?.displayName || "User"}
                  </h2>
                  <p className="text-sm text-slate-400 text-center mt-1">
                    {user?.email}
                  </p>
                </div>

                {/* Account Info */}
                <div className="space-y-3 border-t border-slate-700/50 pt-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-sm text-slate-300 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">Member Since</p>
                      <p className="text-sm text-slate-300">
                        {user?.metadata?.creationTime
                          ? new Date(user.metadata.creationTime).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <Button
                  onClick={() => {
                    if (isEditing) {
                      handleCancel();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form */}
            {isEditing && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-700/50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Total Sessions */}
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Sessions</p>
                      <p className="text-3xl font-bold text-cyan-400">
                        {statsLoading ? '-' : stats?.totalSessions ?? 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Focus Time */}
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-emerald-400/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total Focus Time</p>
                      <p className="text-3xl font-bold text-emerald-400">
                        {statsLoading ? '-' : `${stats?.totalFocusTime ?? 0}h`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Streak */}
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-orange-400/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Current Streak</p>
                      <p className="text-3xl font-bold text-orange-400">
                        {statsLoading ? '-' : `${stats?.currentStreak ?? 0}d`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                      <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Longest Streak */}
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-purple-400/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Longest Streak</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {statsLoading ? '-' : `${stats?.longestStreak ?? 0}d`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                  Weekly Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Sessions This Week
                      </p>
                      <p className="text-xs text-slate-500">
                        Keep up the momentum!
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1">
                    {statsLoading ? '-' : stats?.sessionsThisWeek ?? 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Coffee className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Average Session Duration
                      </p>
                      <p className="text-xs text-slate-500">
                        Consistent focus time
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1">
                    {statsLoading ? '-' : `${stats?.averageSessionDuration ?? 0}m`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Weekly Trend
                      </p>
                      <p className="text-xs text-slate-500">
                        Your productivity direction
                      </p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 ${
                    stats?.weeklyTrend === 'improving' 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
                      : stats?.weeklyTrend === 'declining'
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {statsLoading ? '-' : stats && stats.weeklyTrend ? stats.weeklyTrend.charAt(0).toUpperCase() + stats.weeklyTrend.slice(1) : '-'}
                  </Badge>
                </div>

                {stats?.topTag && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          Top Focus Area
                        </p>
                        <p className="text-xs text-slate-500">
                          Your most focused tag
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 px-3 py-1">
                      {stats.topTag}
                    </Badge>
                  </div>
                )}

                {stats && stats.focusScoreAverage && stats.focusScoreAverage > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          Average Focus Score
                        </p>
                        <p className="text-xs text-slate-500">
                          Quality of your sessions
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30 px-3 py-1">
                      {stats.focusScoreAverage}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-slate-900/50 border-slate-700/50" id="preferences">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-slate-400" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Receive updates about your progress
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Sound Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Play sounds during focus sessions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Dark Mode
                    </p>
                    <p className="text-xs text-slate-500">
                      Always enabled for your comfort
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-not-allowed opacity-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Insights — My Reflections */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <button
                  onClick={() => setInsightsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-violet-400" />
                    My Reflections
                  </CardTitle>
                  {insightsOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </CardHeader>
              {insightsOpen && (
                <CardContent className="pt-0">
                  <ReflectionDashboard />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppLayout>
      <ProfilePageContent />
    </AppLayout>
  );
}
