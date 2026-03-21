"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Timer, 
  TrendingUp, 
  ListTodo, 
  Brain, 
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  BarChart3,
  FileText,
  Layers,
  HelpCircle,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ className = "", isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navigation = [
    {
      name: "Focus",
      href: "/focus",
      icon: Timer,
      description: "Pomodoro & Focus Sessions",
      gradient: "from-red-500 to-orange-500"
    },
    {
      name: "Analytics",
      href: "/focus/analytics",
      icon: TrendingUp,
      description: "Productivity Insights",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      name: "Documents",
      href: "/study/documents",
      icon: FileText,
      description: "Study Materials",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Flashcards",
      href: "/study/flashcards",
      icon: Layers,
      description: "Review & Practice",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      name: "Quizzes",
      href: "/study/quizzes",
      icon: HelpCircle,
      description: "Test Your Knowledge",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      name: "Study Analytics",
      href: "/study/analytics",
      icon: BookOpen,
      description: "Learning Insights",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      description: "Account & Settings",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/focus") {
      return pathname === "/focus";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/20"
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-slate-950/95 border-r border-slate-800/50 backdrop-blur-sm z-40
        transition-all duration-300 ease-in-out shadow-xl
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : 'space-x-3 flex-1'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                {!isCollapsed && (
                  <span className="text-lg font-semibold text-slate-100 truncate">
                    Veyra
                  </span>
                )}
              </div>
              
              {/* Collapse/Expand Button */}
              {!isCollapsed && (
                <Button
                  onClick={() => onToggleCollapse(!isCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-300 ml-2 flex-shrink-0"
                  title="Collapse sidebar"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Expand Button for Collapsed State */}
            {isCollapsed && (
              <div className="flex justify-center mt-2">
                <Button
                  onClick={() => onToggleCollapse(!isCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-300 w-8 h-8 p-0"
                  title="Expand sidebar"
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      console.log('Navigation clicked:', item.name, 'Collapsed state:', isCollapsed);
                      // Only close mobile menu, don't affect collapsed state
                      setIsMobileOpen(false);
                      // Prevent any potential event bubbling that might trigger collapse
                      e.stopPropagation();
                    }}
                    className={`
                      flex items-center px-3 py-3 rounded-lg transition-all duration-200
                      ${active 
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }
                      ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    `}
                  >
                    <item.icon className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 w-5 h-5`} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className={`text-xs truncate ${
                          active ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-400'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800/50">
            {!isCollapsed && user && (
              <div className="mb-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {user.displayName || "User"}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative group">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  {!isCollapsed && <span className="ml-2 text-sm">Profile</span>}
                </Link>
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    Profile
                  </div>
                )}
              </div>
              
              <div className="relative group">
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className={`w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${
                    isCollapsed ? 'px-2' : 'justify-start'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {!isCollapsed && <span className="ml-2">Sign Out</span>}
                </Button>
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    Sign Out
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}