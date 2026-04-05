"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  BarChart3,
  ArrowRight,
  Zap,
  FileText,
  BookOpen,
  ClipboardList,
  Timer,
  TrendingDown,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Upload,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-in");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".scroll-animate").forEach((el) => {
      observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: FileText,
      title: "Upload Your Notes",
      description: "Upload any PDF — lecture notes, textbooks, research papers. Veyra reads it so you don't have to start from scratch.",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: Sparkles,
      title: "AI Builds Your Study Set",
      description: "LLaMA 3.3 70B generates flashcards and quizzes tailored to your material. No manual work, no guesswork.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: TrendingDown,
      title: "Trust the Process",
      description: "Analytics surface exactly where you're weak. Veyra gives you the truth about your knowledge — so you can act on it.",
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  const capabilities = [
    {
      icon: BookOpen,
      title: "AI Flashcards",
      description: "Question-answer pairs generated from your documents with difficulty ratings from 1 to 5.",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: ClipboardList,
      title: "Adaptive Quizzes",
      description: "Timed multiple-choice quizzes with per-question tracking, scoring, and detailed explanations.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Study Analytics",
      description: "Dashboard showing scores, trends, and weak areas across all your attempts over time.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Timer,
      title: "Focus Sessions",
      description: "Pomodoro and stopwatch timers to track your study time and build consistent habits.",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-500/15 to-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/15 to-teal-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Veyra
              </span>
              <span className="ml-2 text-xs text-slate-500 hidden sm:inline">faith in your learning</span>
            </div>
          </div>
          {!user && (
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-violet-400 transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-105">
                  Get Started Free
                </Button>
              </Link>
            </div>
          )}
          {user && (
            <Link href="/focus">
              <Button className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-105">
                Go to App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-28">
        <div className="max-w-5xl mx-auto text-center">
          <div className="scroll-animate">
            <Badge className="mb-6 bg-violet-500/15 text-violet-300 border-violet-500/30 px-4 py-2 text-sm font-medium">
              <Star className="w-3.5 h-3.5 mr-2 inline fill-violet-300" />
              Veyra — from <em>viera</em>, meaning faith &amp; truth
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 scroll-animate leading-tight">
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Have Faith
            </span>
            <br />
            <span className="text-slate-100">in Your Learning</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed scroll-animate">
            Veyra turns your PDF notes into flashcards, quizzes, and a clear picture of what you actually know —
            so you can study with confidence, not anxiety.
          </p>
          <p className="text-slate-500 text-base mb-12 scroll-animate">
            Powered by LLaMA 3.3 70B via Groq
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center scroll-animate">
            {user ? (
              <>
                <Link href="/study/documents">
                  <Button size="lg" className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:scale-105 group">
                    <Upload className="mr-3 h-5 w-5" />
                    Upload a Document
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/study/analytics">
                  <Button size="lg" variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-violet-300 hover:border-violet-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105">
                    <BarChart3 className="mr-3 h-5 w-5" />
                    View Analytics
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:scale-105 group">
                    <Zap className="mr-3 h-5 w-5" />
                    Start for Free
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-violet-300 hover:border-violet-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">
              Three Steps to{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Clarity
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Veyra removes the uncertainty from studying. You bring the material — Veyra brings the truth about where you stand.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 scroll-animate">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card
                  key={i}
                  className={`bg-slate-900/50 border-slate-700/50 transition-all duration-300 cursor-default ${
                    currentStep === i
                      ? "ring-2 ring-violet-400/50 shadow-xl shadow-violet-500/10 border-violet-400/40"
                      : "hover:border-slate-600/50"
                  }`}
                  onMouseEnter={() => setCurrentStep(i)}
                >
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${s.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg transition-transform duration-300 ${
                        currentStep === i ? "scale-110" : ""
                      }`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">
                      Step {i + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-3">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">
              Built for Students Who{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Mean It
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every feature in Veyra is designed around one idea — giving you an honest, accurate picture of your knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-animate">
            {capabilities.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card
                  key={i}
                  className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 group"
                >
                  <CardContent className="p-6">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-slate-100 font-semibold mb-2 group-hover:text-violet-300 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{c.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Truth section — weak areas */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto scroll-animate">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-10 md:p-14 border border-slate-700/50 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-violet-500/15 text-violet-300 border-violet-500/30">
                  <Sparkles className="w-3 h-3 mr-1 inline" />
                  The Truth Engine
                </Badge>
                <h3 className="text-3xl font-bold text-slate-100 mb-4">
                  Veyra Tells You What You Don't Know
                </h3>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  Most students study what they're comfortable with. Veyra identifies the gaps —
                  the topics where your confidence doesn't match your actual score — and puts them
                  front and center. That's the truth part of the name.
                </p>
                <div className="space-y-3">
                  {[
                    "Weak area detection from every quiz attempt",
                    "LLM-powered personalized recommendations",
                    "Score trends that show if you're actually improving",
                    "Focus time tracked per topic so nothing gets ignored",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-violet-400 mr-3 flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock analytics */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/30">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-slate-300 font-medium text-sm">Weak Areas — Last 30 Days</span>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    2 need attention
                  </Badge>
                </div>
                <div className="space-y-4">
                  {[
                    { topic: "Neural Networks", score: 42, color: "from-red-500 to-orange-500" },
                    { topic: "Firewall Concepts", score: 58, color: "from-orange-500 to-yellow-500" },
                    { topic: "OSI Model", score: 81, color: "from-emerald-500 to-teal-500" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-300">{item.topic}</span>
                        <span className={item.score < 70 ? "text-orange-400 font-medium" : "text-emerald-400 font-medium"}>
                          {item.score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-violet-300 text-xs leading-relaxed">
                      Veyra suggests reviewing Neural Networks flashcards before your next attempt. Your last 3 scores show a declining trend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline quote */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center scroll-animate">
          <blockquote className="text-2xl md:text-3xl font-light text-slate-300 italic leading-relaxed">
            "Faith without knowledge is hope. Knowledge without faith is anxiety.
            <br />
            <span className="text-violet-400 not-italic font-semibold">Veyra gives you both.</span>"
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center scroll-animate">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-12 border border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-slate-100">Ready to Study with </span>
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Confidence?
              </span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Upload your first document and have flashcards ready in under a minute.
              No setup, no credit card, no guesswork.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/study/documents">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:scale-105 group"
                  >
                    <Upload className="mr-3 h-5 w-5" />
                    Upload a Document
                    <ChevronRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-400 hover:to-blue-500 text-white text-lg px-8 py-4 rounded-xl shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:scale-105 group"
                    >
                      <Zap className="mr-3 h-5 w-5" />
                      Start with Veyra — Free
                      <ChevronRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-violet-300 hover:border-violet-400/50 text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                    >
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
      <footer className="relative z-10 px-6 py-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Veyra
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-1">
            Faith in your learning. Truth in your knowledge.
          </p>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Veyra — Final Year Project
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .scroll-animate {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
