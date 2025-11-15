"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  CheckSquare,
  Timer,
  Brain,
  BarChart3,
  Play,
  ArrowRight,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Users,
  Award,
  Sparkles,
  Clock,
  PieChart,
  Layers,
  Rocket,
  Star,
  ChevronRight,
  Globe,
  Shield,
  Smartphone,
  Headphones,
  Eye,
  Lightbulb,
  BookOpen,
  Coffee,
  Flame
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { user, loading } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Auto-rotate feature showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Timer,
      title: "Smart Focus Sessions",
      description: "Pomodoro & custom timers with AI-powered break suggestions",
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: CheckSquare,
      title: "Task Management", 
      description: "Organize your tasks with tags, priorities, and smart lists",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into productivity patterns and performance", 
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set, track, and achieve your academic and personal goals",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  // Don't block rendering while checking auth - show content immediately

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Academic Buddy
            </span>
          </div>
          
          {!user && (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="scroll-animate">
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              The Future of Academic Productivity
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 scroll-animate">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Master Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Academic Journey
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed scroll-animate">
            {user 
              ? "Welcome back! Your productivity command center awaits. Ready to achieve more than ever before?" 
              : "Transform your study sessions with AI-powered focus tools, smart task management, and deep analytics that adapt to your learning style."
            }
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 scroll-animate">
            {user ? (
              <>
                <Link href="/focus">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 group">
                    <Rocket className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    Launch Focus Mode
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/focus/analytics">
                  <Button size="lg" variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-purple-300 hover:border-purple-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group">
                    <BarChart3 className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    View Analytics
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 group">
                    <Rocket className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    Start Your Journey
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-purple-300 hover:border-purple-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group">
                    <Play className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                    Watch Demo
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-slate-400 scroll-animate">
            {user ? (
              <>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-emerald-400 mr-2" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-cyan-400 mr-2" />
                  <span>Cloud Synced</span>
                </div>
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-purple-400 mr-2" />
                  <span>Cross-Platform</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-cyan-400 mr-2" />
                  <span>Setup in 60 seconds</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-400 mr-2" />
                  <span>Join 50,000+ students</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Powerful Features That
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Accelerate Success
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Every tool you need to transform your academic performance, all in one beautifully designed platform.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`bg-slate-900/50 border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group ${
                    currentFeature === index ? 'ring-2 ring-cyan-400/50 shadow-2xl shadow-cyan-500/20 border-cyan-400/50' : ''
                  }`}
                  onMouseEnter={() => setCurrentFeature(index)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 ${
                      currentFeature === index ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                      currentFeature === index ? 'text-cyan-300' : 'text-slate-100 group-hover:text-cyan-400'
                    }`}>{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Feature Showcase */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-8 md:p-12 border border-slate-700/50 backdrop-blur-sm scroll-animate transition-all duration-500">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fadeIn">
                <div className={`w-20 h-20 bg-gradient-to-br ${features[currentFeature].gradient} rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500`}>
                  {(() => {
                    const IconComponent = features[currentFeature].icon;
                    return <IconComponent className="h-10 w-10 text-white" />;
                  })()}
                </div>
                <h3 className="text-3xl font-bold text-slate-100 mb-4 transition-all duration-300">{features[currentFeature].title}</h3>
                <p className="text-lg text-slate-300 mb-6 leading-relaxed transition-all duration-300">{features[currentFeature].description}</p>
                
                {currentFeature === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300">
                      <Headphones className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Ambient soundscapes and focus music</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Eye className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Distraction blocking and website filtering</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Lightbulb className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>AI-powered break suggestions</span>
                    </div>
                  </div>
                )}
                
                {currentFeature === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300">
                      <Calendar className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Interactive Kanban boards and timelines</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Users className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Team collaboration and file sharing</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Target className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Milestone tracking and progress visualization</span>
                    </div>
                  </div>
                )}
                
                {currentFeature === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300">
                      <PieChart className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Detailed productivity insights and trends</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <TrendingUp className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Performance predictions and recommendations</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Award className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Achievement tracking and goal completion</span>
                    </div>
                  </div>
                )}
                
                {currentFeature === 3 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300">
                      <BookOpen className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Academic and personal goal setting</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Coffee className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Habit formation and routine building</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Flame className="h-5 w-5 text-cyan-400 mr-3" />
                      <span>Streak tracking and motivation systems</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
                      Live Preview
                    </Badge>
                  </div>
                  
                  {/* Mock Interface - Changes based on feature */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${features[currentFeature].gradient} rounded-lg flex items-center justify-center`}>
                          {(() => {
                            const IconComponent = features[currentFeature].icon;
                            return <IconComponent className="h-4 w-4 text-white" />;
                          })()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {currentFeature === 0 && "Focus Session"}
                            {currentFeature === 1 && "Task Management"}
                            {currentFeature === 2 && "Analytics Dashboard"}
                            {currentFeature === 3 && "Goal Tracker"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {currentFeature === 0 && "25:00 remaining"}
                            {currentFeature === 1 && "8 tasks • 3 in progress"}
                            {currentFeature === 2 && "This week"}
                            {currentFeature === 3 && "5 active goals"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-400">Active</span>
                      </div>
                    </div>
                    
                    {/* Feature-specific content */}
                    {currentFeature === 0 && (
                      <div className="space-y-3">
                        {/* Timer Display */}
                        <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                          <div className="text-4xl font-bold text-cyan-300 mb-2">25:00</div>
                          <div className="text-xs text-slate-400">Focus Time</div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-slate-200">4</div>
                            <div className="text-xs text-slate-500">Sessions</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-slate-200">2h</div>
                            <div className="text-xs text-slate-500">Today</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-slate-200">98%</div>
                            <div className="text-xs text-slate-500">Focus</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {currentFeature === 1 && (
                      <div className="space-y-2">
                        {/* Kanban columns */}
                        {['To Do', 'In Progress', 'Done'].map((status, i) => (
                          <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-300">{status}</span>
                              <span className="text-xs text-slate-500">{i === 0 ? '3' : i === 1 ? '2' : '5'}</span>
                            </div>
                            <div className="space-y-1">
                              {[...Array(i === 0 ? 2 : i === 1 ? 1 : 2)].map((_, j) => (
                                <div key={j} className="bg-slate-600/50 rounded p-2">
                                  <div className="w-full h-2 bg-slate-500 rounded mb-1"></div>
                                  <div className="w-3/4 h-1.5 bg-slate-600 rounded"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {currentFeature === 2 && (
                      <div className="space-y-3">
                        {/* Chart */}
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-end justify-between h-24 space-x-2">
                            {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                              <div key={i} className="flex-1 flex flex-col justify-end">
                                <div 
                                  className={`w-full rounded-t ${i === 6 ? 'bg-gradient-to-t from-cyan-500 to-blue-500' : 'bg-slate-600'}`}
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                              <span key={i} className="text-xs text-slate-500">{day}</span>
                            ))}
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-sm font-bold text-emerald-400">+24%</div>
                            <div className="text-xs text-slate-500">vs last week</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-sm font-bold text-cyan-400">12.5h</div>
                            <div className="text-xs text-slate-500">Total time</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {currentFeature === 3 && (
                      <div className="space-y-2">
                        {/* Goals list */}
                        {[
                          { name: 'Complete Math Assignment', progress: 75, color: 'cyan' },
                          { name: 'Read 2 Chapters', progress: 50, color: 'emerald' },
                          { name: 'Study for Exam', progress: 90, color: 'purple' }
                        ].map((goal, i) => (
                          <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-200">{goal.name}</span>
                              <span className="text-xs text-slate-400">{goal.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full bg-gradient-to-r ${
                                  goal.color === 'cyan' ? 'from-cyan-400 to-blue-500' :
                                  goal.color === 'emerald' ? 'from-emerald-400 to-teal-500' :
                                  'from-purple-400 to-pink-500'
                                }`}
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                        {/* Streak */}
                        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">🔥</div>
                          <div className="text-sm font-bold text-orange-400">7 Day Streak!</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Progress indicator */}
                    <div className="flex space-x-2 pt-2">
                      {[...Array(4)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 h-1 rounded transition-all duration-300 ${
                            i === currentFeature 
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                              : 'bg-slate-700'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 scroll-animate">
            {[
              { number: "50K+", label: "Active Students", icon: Users, color: "from-cyan-400 to-blue-500" },
              { number: "2M+", label: "Focus Sessions", icon: Timer, color: "from-emerald-400 to-teal-500" },
              { number: "98%", label: "Satisfaction Rate", icon: Star, color: "from-yellow-400 to-orange-500" },
              { number: "150+", label: "Universities", icon: Award, color: "from-purple-400 to-pink-500" }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform group-hover:scale-110`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.number}
                    </div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-12 border border-slate-700/50 backdrop-blur-sm scroll-animate">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Your Academic Life?
              </span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              {user 
                ? "Your productivity journey continues. Explore new features and reach new heights." 
                : "Join thousands of students who've already transformed their study habits and achieved their goals."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link href="/focus/analytics">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 group">
                      <BarChart3 className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                      View Analytics
                      <ChevronRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 group">
                      <Zap className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                      Get Started Now
                      <ChevronRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-purple-300 hover:border-purple-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Academic Buddy
            </span>
          </div>
          <p className="text-slate-400 mb-4">
            Empowering students worldwide to achieve academic excellence through intelligent productivity tools.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
            <span>© 2024 Academic Buddy</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Support</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scroll-animate {
          opacity: 0;
          transform: translateY(60px) rotateX(25deg);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
        }
        .scroll-animate:nth-child(2) {
          transition-delay: 0.1s;
        }
        .scroll-animate:nth-child(3) {
          transition-delay: 0.2s;
        }
        .scroll-animate:nth-child(4) {
          transition-delay: 0.3s;
        }
        .scroll-animate:nth-child(5) {
          transition-delay: 0.4s;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}