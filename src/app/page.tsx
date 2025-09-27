"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Timer,
  Brain,
  BarChart3,
  Play,
  ArrowRight,
  Target,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

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
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 relative overflow-hidden">
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
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-12">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-100 transition-colors duration-300 group-hover:text-blue-400">
              Academic Buddy
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-slate-400 hover:text-slate-100 transition-all duration-300 ease-in-out hover:scale-105 relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full"></span>
            </a>

            <a
              href="#pricing"
              className="text-slate-400 hover:text-slate-100 transition-all duration-300 ease-in-out hover:scale-105 relative group"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all duration-300 ease-in-out hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                  AI-Powered Study Assistant
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-slate-100 transition-all duration-500 ease-in-out hover:scale-[1.02] origin-left">
                  What can I help you{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                    study?
                  </span>
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed max-w-lg transition-all duration-300 ease-in-out hover:text-slate-300">
                  Transform scattered study sessions into organized, productive
                  learning with smart task management, focus sessions, and
                  AI-generated study materials.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 group"
                  >
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent hover:text-slate-100 transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-500/50 group"
                >
                  <Play className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Setup in 2 minutes
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30">
                <Card className="bg-slate-900/50 border-slate-700/50 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-slate-800/50">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-100">
                          Today's Focus
                        </h3>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 animate-pulse">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 group">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-300 transition-colors duration-300 group-hover:text-blue-400">
                            Mathematics - Calculus Review
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full w-3/4 transition-all duration-1000 ease-in-out hover:w-full"></div>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400">
                          <span>3 of 4 tasks completed</span>
                          <span>2h 15m focused</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-slate-100 transition-all duration-500 ease-in-out hover:scale-[1.02] scroll-animate">
              Everything you need{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                in one place
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto transition-colors duration-300 hover:text-slate-300 scroll-animate">
              Explore what the community is building with Academic Buddy
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Smart Task Management",
                description:
                  "AI-categorized tasks with priority matrix and calendar integration",
              },
              {
                icon: Timer,
                title: "Pomodoro Focus Sessions",
                description:
                  "Built-in timer with session tracking and productivity analytics",
              },
              {
                icon: Brain,
                title: "Instant Study Materials",
                description:
                  "Upload PDFs and get AI-generated flashcards and quizzes automatically",
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description:
                  "Track focus hours, completion rates, and study patterns over time",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-slate-900/50 border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-500 ease-in-out group backdrop-blur-sm hover:scale-105 hover:-translate-y-2 hover:bg-slate-800/50 hover:border-blue-500/30 scroll-animate"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-12">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold group-hover:text-blue-400 transition-all duration-300 text-slate-100">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 leading-relaxed transition-colors duration-300 group-hover:text-slate-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm relative">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-slate-100 transition-all duration-500 ease-in-out hover:scale-[1.02] scroll-animate">
            Ready to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              transform your study sessions?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed transition-colors duration-300 hover:text-slate-300 scroll-animate">
            Join thousands of students who've improved their productivity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 scroll-animate">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent hover:text-slate-100 transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-500/50"
              >
                Sign in with Google
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-500 scroll-animate">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/80 py-12 px-6 backdrop-blur-sm relative">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-12">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-slate-100 transition-colors duration-300 group-hover:text-blue-400">
                  Academic Buddy
                </span>
                <p className="text-sm text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                  Your AI-powered study companion
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <a
                href="#"
                className="hover:text-slate-200 transition-all duration-300 ease-in-out hover:scale-105 relative group"
              >
                Privacy Policy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#"
                className="hover:text-slate-200 transition-all duration-300 ease-in-out hover:scale-105 relative group"
              >
                Terms of Service
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#"
                className="hover:text-slate-200 transition-all duration-300 ease-in-out hover:scale-105 relative group"
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center text-sm text-slate-500">
            © 2025 Academic Buddy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
