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
  TrendingUp,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Upload,
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
      title: "AI-Powered Content Generation",
      description: "Upload any PDF and Veyra instantly generates flashcards and quizzes using LLaMA 3.3 70B. Difficulty levels 1–5, up to 50 questions — zero manual work.",
      gradient: "from-cyan-500 to-blue-500",
      label: "Pillar 1",
    },
    {
      icon: BarChart3,
      title: "Comprehensive Learning Analytics",
      description: "Every quiz attempt, flashcard review, and focus session is tracked. Weak area detection, score trends, and 7/30/90-day breakdowns give you the full picture.",
      gradient: "from-violet-500 to-purple-600",
      label: "Pillar 2",
    },
    {
      icon: Brain,
      title: "Multi-Agent Behavioral Intelligence",
      description: "Four specialized AI agents — Focus Coach, Study Companion, Productivity Analyst, and Reflection Agent — work together to proactively surface insights and coach your behavior.",
      gradient: "from-emerald-500 to-teal-500",
      label: "Pillar 3",
    },
  ];

  const capabilities = [
    {
      icon: BookOpen,
      title: "AI Flashcards",
      description: "AI-generated question-answer pairs from your PDFs, with difficulty ratings 1–5 and spaced review tracking.",
      gradient: "from-cyan-500 to-blue-500",
      pillar: "Pillar 1",
    },
    {
      icon: ClipboardList,
      title: "Adaptive Quizzes",
      description: "Timed multiple-choice quizzes with per-question scoring, correct/wrong tracking, and AI weak-area analysis.",
      gradient: "from-blue-500 to-indigo-500",
      pillar: "Pillar 1",
    },
    {
      icon: BarChart3,
      title: "Learning Analytics",
      description: "Track flashcards reviewed, quizzes completed, avg quiz score, and total study time — across 7, 30, or 90 days.",
      gradient: "from-violet-500 to-purple-600",
      pillar: "Pillar 2",
    },
    {
      icon: Brain,
      title: "4 AI Agents",
      description: "Focus Coach, Study Companion, Productivity Analyst, and Reflection Agent — each analyzing your behavior from a different angle.",
      gradient: "from-emerald-500 to-teal-500",
      pillar: "Pillar 3",
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
              <Sparkles className="w-3.5 h-3.5 mr-2 inline" />
              AI-Powered Study Platform — Free to Get Started
            </Badge>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold mb-4 scroll-animate leading-none tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Veyra
            </span>
          </h1>

          <p className="text-2xl md:text-3xl font-semibold text-slate-200 mb-5 scroll-animate tracking-tight">
            Study smarter. Focus deeper. Know exactly where you stand.
          </p>

          <p className="text-lg md:text-xl text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed scroll-animate">
            Veyra turns your PDFs into flashcards and quizzes, tracks your weak areas with AI,
            and coaches your focus sessions — so every hour you put in actually counts.
          </p>
          <p className="text-slate-500 text-sm mb-12 scroll-animate">
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
              Three Pillars of{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Intelligent Learning
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Veyra isn't just a study tool. It's a coordinated intelligence system built around three interconnected pillars.
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
                      {s.label}
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
              What's Inside{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Each Pillar
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every feature maps directly to one of the three pillars — nothing is filler.
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
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/50">
                        {c.pillar}
                      </span>
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

      {/* Pillar 1 — Content Generation showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto scroll-animate">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-10 md:p-14 border border-slate-700/50 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                  <FileText className="w-3 h-3 mr-1 inline" />
                  Pillar 1 — AI Content Generation
                </Badge>
                <h3 className="text-3xl font-bold text-slate-100 mb-4">
                  Upload a PDF. Get a Full Study Set.
                </h3>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  Veyra extracts your document and uses LLaMA 3.3 70B via Groq to generate
                  flashcards and quizzes in seconds. No manual work, no copy-pasting — just
                  upload and study.
                </p>
                <div className="space-y-3">
                  {[
                    "Flashcards with difficulty ratings 1–5, generated from your content",
                    "Multiple-choice quizzes with up to 50 questions per document",
                    "Configurable difficulty level before generation",
                    "Works with lecture notes, textbooks, and research papers",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content generation mock */}
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-600/30 space-y-4">
                {/* Document */}
                <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">Neural_Networks.pdf</p>
                    <p className="text-slate-500 text-xs">2.4 MB · Uploaded just now</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">Ready</span>
                </div>
                {/* Generation options */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 rounded-xl border border-cyan-500/30 p-3 text-center">
                    <BookOpen className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                    <p className="text-slate-200 text-sm font-medium">Flashcards</p>
                    <p className="text-slate-500 text-xs">Difficulty: 3/5</p>
                    <div className="mt-2 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">20 generated</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl border border-violet-500/30 p-3 text-center">
                    <ClipboardList className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
                    <p className="text-slate-200 text-sm font-medium">Quiz</p>
                    <p className="text-slate-500 text-xs">10 questions · Timed</p>
                    <div className="mt-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">Ready to take</div>
                  </div>
                </div>
                {/* Sample flashcard */}
                <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs uppercase tracking-wide">Sample Flashcard</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-2 h-2 rounded-full ${n <= 3 ? "bg-cyan-400" : "bg-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm font-medium mb-2">What is backpropagation?</p>
                  <p className="text-slate-500 text-xs leading-relaxed">An algorithm that computes gradients of the loss function with respect to each weight by applying the chain rule, propagating errors backward through the network.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillar 2 — Study Analytics showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto scroll-animate">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-10 md:p-14 border border-slate-700/50 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                  <BarChart3 className="w-3 h-3 mr-1 inline" />
                  Pillar 2 — Learning Analytics
                </Badge>
                <h3 className="text-3xl font-bold text-slate-100 mb-4">
                  Know Exactly Where You Stand
                </h3>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  After every quiz, Veyra's AI pinpoints the topics you're weak on and tells you
                  exactly what to review next. No more guessing what to study — the data does the thinking.
                </p>
                <div className="space-y-3">
                  {[
                    "Flashcards reviewed, quizzes completed, avg score — all in one view",
                    "AI weak-area analysis on every quiz attempt",
                    "Score trends across 7, 30, and 90 day windows",
                    "LLM-powered recommendations tied to your actual results",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-cyan-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Overview mock — matches real StudyAnalyticsDashboard UI */}
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-600/30 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 font-medium text-sm">Study Overview</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">7 Days</span>
                </div>
                {/* Stat cards — exact colors from real UI */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Flashcards Reviewed", value: "84", color: "text-cyan-400", border: "border-slate-700/50" },
                    { label: "Quizzes Completed", value: "12", color: "text-purple-400", border: "border-slate-700/50" },
                    { label: "Avg Quiz Score", value: "73%", color: "text-green-400", border: "border-slate-700/50" },
                    { label: "Total Study Time", value: "6h 20m", color: "text-blue-400", border: "border-slate-700/50" },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-slate-800/40 rounded-lg p-3 border ${stat.border}`}>
                      <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Weak area analysis — matches WeakAreasComponent */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Weak Area Analysis</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">2 need attention</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { topic: "Neural Networks", score: 42, color: "from-red-500 to-orange-500", textColor: "text-orange-400" },
                      { topic: "Firewall Concepts", score: 58, color: "from-orange-500 to-yellow-500", textColor: "text-orange-400" },
                      { topic: "OSI Model", score: 81, color: "from-emerald-500 to-teal-500", textColor: "text-emerald-400" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{item.topic}</span>
                          <span className={`font-medium ${item.textColor}`}>{item.score}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-violet-300 text-xs leading-relaxed">Review Neural Networks flashcards — your last 3 scores show a declining trend.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillar 3 — Multi-Agent Intelligence showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto scroll-animate">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-3xl p-10 md:p-14 border border-slate-700/50 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Focus session mock — matches real Focus page UI */}
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-600/30 space-y-4 order-2 lg:order-1">
                {/* Timer display */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center">
                    <Timer className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">Focus Session</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Pomodoro</span>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(51,65,85)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#timerGrad)" strokeWidth="8"
                        strokeDasharray="263.9" strokeDashoffset="66" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-100 tabular-nums">18:45</span>
                      <span className="text-xs text-slate-400">Focus</span>
                    </div>
                  </div>
                </div>
                {/* Tag */}
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">📚 Computer Networks</span>
                </div>
                {/* Weekly productivity report — matches ProductivityAnalystDashboard */}
                <div className="border-t border-slate-700/50 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Weekly Report</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />Increasing
                    </span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-slate-100">78</span>
                    <span className="text-slate-500 text-sm mb-1">/100 weekly score</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: "Focus Hours", value: "+12.5%" },
                      { label: "Sessions", value: "+8.3%" },
                      { label: "Avg Score", value: "+5.1%" },
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-800/60 rounded-lg p-2 text-center">
                        <p className="text-slate-500 mb-0.5">{m.label}</p>
                        <p className="text-emerald-400 font-semibold">{m.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Coach tip — matches FocusCoachNotification */}
                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                        <Brain className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-300 text-xs font-semibold">Focus Coach</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">Your sessions are getting shorter after 8 PM. Try shifting your deep work to mornings for better retention.</p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <Badge className="mb-4 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  <Brain className="w-3 h-3 mr-1 inline" />
                  Pillar 3 — Multi-Agent Intelligence
                </Badge>
                <h3 className="text-3xl font-bold text-slate-100 mb-4">
                  Four Agents. One Unified Learning Experience.
                </h3>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  This is what makes Veyra fundamentally different. Four specialized autonomous agents
                  analyze your behavior from different angles — proactively surfacing insights
                  without you having to ask.
                </p>
                <div className="space-y-3">
                  {[
                    "Focus Coach — inline feedback after every session (5ms latency)",
                    "Study Companion — identifies knowledge gaps from quiz performance",
                    "Productivity Analyst — weekly score, burnout detection, trend analysis",
                    "Reflection Agent — correlates focus hours with quiz scores across time",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
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
