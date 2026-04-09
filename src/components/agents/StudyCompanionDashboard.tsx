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
    totalQuizAttempts: number;
    avgQuizScore: number;
  };
  materialPerformance: MaterialPerformance[];
  topicsNeedingAttention: string[];
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
  IMPROVING: <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
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
    IMPROVING: "bg-green-500/20 text-green-400 border-green-500/30",
    DECLINING: "bg-red-500/20 text-red-400 border-red-500/30",
    STABLE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    FIRST_ATTEMPT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Quiz Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">
              {quizScore.toFixed(0)}
              <span className="text-lg font-normal text-slate-400 ml-1">%</span>
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Badge variant="outline" className={`text-sm px-3 py-1 ${trendClass[progressTrend]}`}>
              {trendLabel[progressTrend]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {knowledgeGaps.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Topics to Review
            </CardTitle>
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
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Recommendations
            </CardTitle>
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
          <Card key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Material performance */}
      {materialPerformance.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Performance by Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left">
                  <th className="pb-2 font-medium">Material</th>
                  <th className="pb-2 font-medium text-right">Avg Score</th>
                  <th className="pb-2 font-medium text-right">Attempts</th>
                  <th className="pb-2 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {materialPerformance.map((m) => (
                  <tr key={m.materialId}>
                    <td className="py-2 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {m.materialName}
                    </td>
                    <td className="py-2 text-right text-slate-700 dark:text-slate-300">
                      {m.avgScore.toFixed(0)}%
                    </td>
                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                      {m.attemptCount}
                    </td>
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
        <Card className="border border-amber-500/30 bg-amber-500/10 dark:bg-amber-900/20">
          <CardContent className="flex items-start gap-3 pt-4 pb-4">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-400 text-sm mb-1">Topics Needing Attention</p>
              <div className="flex flex-wrap gap-1.5">
                {topicsNeedingAttention.map((t, i) => (
                  <Badge key={i} variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
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

  useEffect(() => {
    const fetchOutputs = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/agents/outputs?agentId=study-companion&limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.outputs)) setOutputs(data.outputs);
      } catch {
        // Silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchOutputs();
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
        <Brain className="w-10 h-10 opacity-40" />
        <p className="text-sm text-center max-w-xs">
          No insights yet — complete a quiz or check back after your first weekly summary.
        </p>
      </div>
    );
  }

  // Split outputs into weekly summaries and quiz outputs
  const weeklyOutputs = outputs.filter((o) => isWeeklyContent(o.content));
  const quizOutputs = outputs.filter((o) => !isWeeklyContent(o.content));
  const latestWeekly = weeklyOutputs[0];
  const latestQuiz = quizOutputs[0];

  return (
    <div className="space-y-8 p-4 max-w-2xl mx-auto">
      {/* Weekly summary section */}
      {latestWeekly && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Weekly Study Summary
            </h2>
            <span className="text-xs text-slate-500 ml-auto">
              {new Date(latestWeekly.createdAt).toLocaleDateString()}
            </span>
          </div>
          <WeeklyOutputView content={latestWeekly.content as WeeklyContent} />
        </section>
      )}

      {/* Latest quiz output */}
      {latestQuiz && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Latest Quiz Analysis
            </h2>
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
