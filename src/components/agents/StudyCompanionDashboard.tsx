"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Layers,
  Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type ProgressTrend = "IMPROVING" | "DECLINING" | "STABLE" | "FIRST_ATTEMPT";
type MaterialTrend = "IMPROVING" | "DECLINING" | "STABLE";

interface Recommendation {
  type: "REVIEW_MATERIAL" | "PRACTICE_MORE" | "FOCUS_TOPIC";
  materialId?: string;
  materialName?: string;
  reason: string;
  priority: Priority;
}

interface MaterialPerformance {
  materialId: string;
  materialName: string;
  avgScore: number;
  attemptCount: number;
  trend: MaterialTrend;
}

interface QuizContent {
  quizScore: number;
  knowledgeGaps: string[];
  recommendations: Recommendation[];
  progressTrend: ProgressTrend;
}

interface WeeklyContent {
  weekSummary: {
    totalFlashcardSessions: number;
    totalFlashcardCards: number;
    totalFlashcardMinutes: number;
    totalQuizAttempts: number;
    avgQuizScore: number;
  };
  materialPerformance: MaterialPerformance[];
  topicsNeedingAttention: Array<{
    topic: string;
    incorrectCount: number;
    totalAppearances: number;
    errorRate: number;
    quizTitles: string[];
    sourceMaterial?: { id: string; fileName: string };
    recommendation: string;
  }>;
}

type OutputContent = QuizContent | WeeklyContent;

interface AgentOutputRecord {
  id: string;
  outputType: string;
  content: OutputContent;
  createdAt: string;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  MEDIUM: { label: "Medium", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  LOW: { label: "Low", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

const trendIcon: Record<MaterialTrend, React.ReactNode> = {
  IMPROVING: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  DECLINING: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
  STABLE: <Minus className="w-3.5 h-3.5 text-slate-400" />,
};

function isWeeklyContent(c: OutputContent): c is WeeklyContent {
  return "weekSummary" in c;
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = priorityConfig[rec.priority];
  return (
    <div className="rounded-md border border-slate-700/50 bg-slate-800/40 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.className}`}>
          {cfg.label}
        </Badge>
        {rec.materialName && (
          <span className="text-xs text-slate-400 truncate">{rec.materialName}</span>
        )}
      </div>
      <p className="text-sm text-slate-300">{rec.reason}</p>
    </div>
  );
}

function QuizOutputView({ content }: { content: QuizContent }) {
  const { quizScore, knowledgeGaps, recommendations, progressTrend } = content;

  const trendLabel: Record<ProgressTrend, string> = {
    IMPROVING: "Improving",
    DECLINING: "Declining",
    STABLE: "Stable",
    FIRST_ATTEMPT: "First Attempt",
  };
  const trendClass: Record<ProgressTrend, string> = {
    IMPROVING: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    DECLINING: "bg-red-500/20 text-red-400 border-red-500/30",
    STABLE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    FIRST_ATTEMPT: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 bg-slate-900/50 border-slate-700/50">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-400">Quiz Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-slate-100">
              {quizScore.toFixed(0)}
              <span className="text-lg font-normal text-slate-500 ml-1">%</span>
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-slate-900/50 border-slate-700/50">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-400">Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Badge variant="outline" className={`text-sm px-3 py-1 ${trendClass[progressTrend]}`}>
              {trendLabel[progressTrend]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {knowledgeGaps.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Topics to Review</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {knowledgeGaps.map((gap, i) => (
              <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 capitalize">
                {gap}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {recommendations.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WeeklyOutputView({ content }: { content: WeeklyContent }) {
  const { weekSummary, materialPerformance, topicsNeedingAttention } = content;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Flashcard Sessions", value: weekSummary.totalFlashcardSessions },
          { label: "Cards Reviewed", value: weekSummary.totalFlashcardCards },
          { label: "Quiz Attempts", value: weekSummary.totalQuizAttempts },
          { label: "Avg Quiz Score", value: `${weekSummary.avgQuizScore.toFixed(0)}%` },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Material performance */}
      {materialPerformance.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">Performance by Material</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left">
                  <th className="pb-2 font-medium">Material</th>
                  <th className="pb-2 font-medium text-right">Avg Score</th>
                  <th className="pb-2 font-medium text-right">Attempts</th>
                  <th className="pb-2 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {materialPerformance.map((m) => (
                  <tr key={m.materialId}>
                    <td className="py-2 text-slate-300 truncate max-w-[140px]">{m.materialName}</td>
                    <td className="py-2 text-right text-slate-300">{m.avgScore.toFixed(0)}%</td>
                    <td className="py-2 text-right text-slate-500">{m.attemptCount}</td>
                    <td className="py-2 text-right flex justify-end items-center gap-1">
                      {trendIcon[m.trend]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Topics needing attention */}
      {topicsNeedingAttention.length > 0 && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              Topics Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicsNeedingAttention.map((topic, i) => (
              <div key={i} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-semibold text-slate-200 capitalize text-sm">{topic.topic}</p>
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs shrink-0">
                    {(topic.errorRate * 100).toFixed(0)}% error
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {topic.incorrectCount} incorrect out of {topic.totalAppearances}
                  {topic.sourceMaterial && ` • ${topic.sourceMaterial.fileName}`}
                </p>
                <p className="text-sm text-slate-300">💡 {topic.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudyCompanionDashboard() {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<AgentOutputRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let pollCount = 0;
    const MAX_POLLS = 5;
    const POLL_INTERVAL_MS = 3000;

    const fetchOutputs = async (): Promise<AgentOutputRecord[]> => {
      if (!user) return [];
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/agents/outputs?agentId=study-companion&limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.outputs) ? data.outputs : [];
      } catch {
        return [];
      }
    };

    const load = async () => {
      const results = await fetchOutputs();
      setOutputs(results);
      setLoading(false);

      if (results.length === 0) {
        setPolling(true);
        const poll = async () => {
          if (pollCount >= MAX_POLLS) {
            setPolling(false);
            return;
          }
          pollCount++;
          const polled = await fetchOutputs();
          if (polled.length > 0) {
            setOutputs(polled);
            setPolling(false);
          } else {
            pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        };
        pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    load();
    return () => { if (pollTimer) clearTimeout(pollTimer); };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Brain className={`w-10 h-10 opacity-40 ${polling ? "animate-pulse" : ""}`} />
        <p className="text-sm text-center max-w-xs">
          {polling
            ? "Analyzing your quiz results…"
            : "No insights yet — complete a quiz or check back after your first weekly summary."}
        </p>
      </div>
    );
  }

  const weeklyOutputs = outputs.filter((o) => isWeeklyContent(o.content));
  const quizOutputs = outputs.filter((o) => !isWeeklyContent(o.content));
  const latestWeekly = weeklyOutputs[0];
  const latestQuiz = quizOutputs[0];

  return (
    <div className="space-y-8 p-4 max-w-2xl mx-auto">
      {latestWeekly && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-200">Weekly Study Summary</h2>
            <span className="text-xs text-slate-500 ml-auto">
              {new Date(latestWeekly.createdAt).toLocaleDateString()}
            </span>
          </div>
          <WeeklyOutputView content={latestWeekly.content as WeeklyContent} />
        </section>
      )}

      {latestQuiz && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Latest Quiz Analysis</h2>
            <span className="text-xs text-slate-500 ml-auto">
              {new Date(latestQuiz.createdAt).toLocaleDateString()}
            </span>
          </div>
          <QuizOutputView content={latestQuiz.content as QuizContent} />
        </section>
      )}
    </div>
  );
}
