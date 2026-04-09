"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Lightbulb,
  GitBranch,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PeriodType = "WEEKLY" | "MONTHLY";

interface ReflectionSummary {
  highlights: string[];
  challenges: string[];
  patterns: string[];
  recommendations: string[];
}

interface ReflectionMetrics {
  totalFocusHours: number;
  totalStudyTimeMinutes: number;
  quizzesCompleted: number;
  avgQuizScore: number;
  flashcardSessions: number;
}

interface ReflectionComparison {
  improvements: string[];
  regressions: string[];
  percentageChanges: Record<string, number>;
}

interface ReflectionContent {
  period: { type: PeriodType; startDate: string; endDate: string };
  summary: ReflectionSummary;
  metrics: ReflectionMetrics;
  comparison?: ReflectionComparison;
}

interface AgentOutputRecord {
  id: string;
  content: ReflectionContent;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SectionList({
  icon,
  title,
  items,
  itemClass,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  itemClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-sm rounded-md px-3 py-2 ${itemClass}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center bg-slate-800/50 rounded-lg px-4 py-3 min-w-[80px]">
      <span className="text-lg font-bold text-slate-100">{value}</span>
      <span className="text-[10px] text-slate-500 text-center mt-0.5">{label}</span>
    </div>
  );
}

function ReflectionCard({ output }: { output: AgentOutputRecord }) {
  const { period, summary, metrics, comparison } = output.content;

  return (
    <div className="space-y-5">
      {/* Period header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs px-2 py-0.5"
        >
          {period.type === "WEEKLY" ? "Weekly" : "Monthly"} Reflection
        </Badge>
        <span className="text-xs text-slate-500">
          {formatDate(period.startDate)} – {formatDate(period.endDate)}
        </span>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-2">
        <MetricPill label="Focus Hours" value={metrics.totalFocusHours.toFixed(1)} />
        <MetricPill label="Quizzes" value={metrics.quizzesCompleted} />
        {metrics.avgQuizScore > 0 && (
          <MetricPill label="Avg Score" value={`${metrics.avgQuizScore.toFixed(0)}%`} />
        )}
        <MetricPill label="Flashcard Sessions" value={metrics.flashcardSessions} />
      </div>

      {/* Narrative sections */}
      <div className="space-y-4">
        <SectionList
          icon={<Star className="w-4 h-4 text-yellow-400" />}
          title="Highlights"
          items={summary.highlights}
          itemClass="bg-yellow-500/10 text-slate-300 border border-yellow-500/20"
        />
        <SectionList
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          title="Challenges"
          items={summary.challenges}
          itemClass="bg-amber-500/10 text-slate-300 border border-amber-500/20"
        />
        <SectionList
          icon={<GitBranch className="w-4 h-4 text-blue-400" />}
          title="Patterns"
          items={summary.patterns}
          itemClass="bg-blue-500/10 text-slate-300 border border-blue-500/20"
        />
        <SectionList
          icon={<Lightbulb className="w-4 h-4 text-emerald-400" />}
          title="Recommendations"
          items={summary.recommendations}
          itemClass="bg-emerald-500/10 text-slate-300 border border-emerald-500/20"
        />
      </div>

      {/* Comparison */}
      {comparison &&
        (comparison.improvements.length > 0 || comparison.regressions.length > 0) && (
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                vs Previous Period
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1.5">
              {comparison.improvements.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-green-400">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  {item}
                </div>
              ))}
              {comparison.regressions.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      <p className="text-xs text-slate-500 text-right">
        Generated {formatDate(output.createdAt)}
      </p>
    </div>
  );
}

export default function ReflectionDashboard() {
  const { user } = useAuth();
  const [outputs, setOutputs] = useState<AgentOutputRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<PeriodType>("WEEKLY");

  useEffect(() => {
    const fetchOutputs = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/agents/outputs?agentId=reflection&limit=8", {
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
      <div className="flex items-center justify-center h-48 text-slate-400">
        <p className="text-sm">Loading reflections…</p>
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-slate-400">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-violet-400 opacity-60" />
        </div>
        <div className="text-center max-w-xs space-y-1">
          <p className="text-sm font-medium text-slate-300">No reflections yet</p>
          <p className="text-xs text-slate-500">
            Your first weekly reflection will be generated automatically every Sunday.
            It synthesizes your focus sessions, quiz results, and flashcard activity into
            a narrative summary with cross-domain insights.
          </p>
        </div>
      </div>
    );
  }

  const weeklyOutputs = outputs.filter((o) => o.content.period.type === "WEEKLY");
  const monthlyOutputs = outputs.filter((o) => o.content.period.type === "MONTHLY");

  const activeOutputs = activePeriod === "WEEKLY" ? weeklyOutputs : monthlyOutputs;
  const latestOutput = activeOutputs[0];
  const historyOutputs = activeOutputs.slice(1);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Period toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activePeriod === "WEEKLY" ? "default" : "outline"}
          onClick={() => setActivePeriod("WEEKLY")}
          className={
            activePeriod === "WEEKLY"
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          }
        >
          Weekly
        </Button>
        <Button
          size="sm"
          variant={activePeriod === "MONTHLY" ? "default" : "outline"}
          onClick={() => setActivePeriod("MONTHLY")}
          className={
            activePeriod === "MONTHLY"
              ? "bg-violet-600 hover:bg-violet-500 text-white"
              : "bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          }
        >
          Monthly
        </Button>
      </div>

      {/* Latest reflection */}
      {latestOutput ? (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-5">
            <ReflectionCard output={latestOutput} />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
          <Clock className="w-8 h-8 opacity-40" />
          <p className="text-sm text-center max-w-xs">
            No {activePeriod.toLowerCase()} reflections yet.{" "}
            {activePeriod === "MONTHLY"
              ? "Monthly reflections are generated on the 1st of each month."
              : "Weekly reflections are generated every Sunday."}
          </p>
        </div>
      )}

      {/* History */}
      {historyOutputs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Past Reflections
          </h3>
          {historyOutputs.map((output) => (
            <Card
              key={output.id}
              className="bg-slate-900/30 border-slate-700/40 hover:border-slate-600/60 transition-colors"
            >
              <CardContent className="p-4">
                <ReflectionCard output={output} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
