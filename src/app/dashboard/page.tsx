"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogOut, User, ListTodo } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, dbUser, signOut, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to login");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-100">
              Academic Buddy
            </span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-100">
              Welcome back, {user.displayName || user.email}! 👋
            </h1>
            <p className="text-xl text-slate-400">
              Your study dashboard is ready to help you succeed
            </p>
          </div>

          {/* User Info Card */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-100">
                <User className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Name:</span>
                  <p className="text-slate-200">{user.displayName || "Not set"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="text-slate-200">{user.email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Account Type:</span>
                  <p className="text-slate-200">
                    {user.providerData[0]?.providerId === "google.com" ? "Google" : "Email"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Member Since:</span>
                  <p className="text-slate-200">
                    {user.metadata.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString() : 
                      "Unknown"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/tasks">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group hover:scale-105">
                    <div className="text-center">
                      <ListTodo className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                      <p className="text-slate-300 font-medium">Task Management</p>
                      <p className="text-slate-500 text-xs mt-1">Create and organize tasks</p>
                    </div>
                  </div>
                </Link>
                
                {[
                  { name: "Pomodoro Timer", desc: "Focus sessions", icon: "⏱️" },
                  { name: "Study Materials", desc: "Upload & generate", icon: "📚" },
                  { name: "Progress Analytics", desc: "Track performance", icon: "📊" }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 opacity-60"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <p className="text-slate-300 font-medium">{feature.name}</p>
                      <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
                      <p className="text-slate-600 text-xs mt-2">Coming Soon</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}