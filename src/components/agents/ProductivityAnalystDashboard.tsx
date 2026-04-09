"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Trend = "INCREASING" | "DECREASING" | "STABLE";
type Severity = "INFO" | "WARNING" | "CRITICAL";

interface Insight {
  type: string;
  severity: Severity;
  message: string;
}

interface ProductivityContent {
  weeklyScore: number;
  trend: Trend;
  burnoutWarning: boolean;
  burnoutDetails?: string;
  weekOverWeek: {
    focusHoursChange: number;
    sessionsChange: number;
    avgScoreChange: number;
  };
  insights: Insight[];
}

interface AgentOutputRecord {
  id: string;
  content: ProductivityContent;
  createdAt: string;
}

const trendConfig: Record<
  Trend,
  { label: string; icon: React.ReactNode; className: string }
> = {
  INCREASING: {
    label: "Increasing",
    icon: <TrendingUp className="w-4 h-4" />,
    className:
      "bg-green-500/20 text-green-400 border-green-500/30 dark:bg-green-500/20 dark:text-green-400",
  },
  DECREASING: {
    label: "Decreasing",
    icon: <TrendingDown className="w-4 h-4" />,
    className:
      "bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-400",
  },
  STABLE: {
    label: "Stable",
    icon: <Minus className="w-4 h-4" />,
    className:
      "bg-slate-500/20 text-slate-400 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-400",
  },
};

const severityConfig: Record<
  Severity,
  { className: string; badgeClass: string }
> = {
  INFO: {
    className:
      "border-blue-500/30 bg-blue-500/10 dark:border-blue-500/30 dark:bg-blue-500/10",
    badgeClass:
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  WARNING: {
    className:
      "border-amber-500/30 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10",
    badgeClass:
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  CRITICAL: {
    className:
      "border-red-500/30 bg-red-500/10 dark:border-red-500/30 dark:bg-red-500/10",
    badgeClass:
      "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function ChangeCell({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const colorClass = isNeutral
    ? "text-slate-400"
    : isPositive
    ? "text-green-400"
    : "text-red-400";
  return <span className={colorClass}>{formatChange(value)}</span>;
}

export default function ProductivityAnalystDashboard() {
  const { user } = useAuth();
  const [output, setOutput] = useState<AgentOutputRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutput = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          "/api/agents/outputs?agentId=productivity-analyst&limit=1",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const record: AgentOutputRecord | undefined = data.outputs?.[0];
        if (record) setOutput(record);
      } catch {
        // Silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchOutput();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p className="text-sm">Loading report…</p>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <BarChart3 className="w-10 h-10 opacity-40" />
        <p className="text-sm text-center max-w-xs">
          No report yet — your first weekly report will be generated this Sunday.
        </p>
      </div>
    );
  }

  const {
    weeklyScore,
    trend,
    burnoutWarning,
    burnoutDetails,
    weekOverWeek,
    insights,
  } = output.content;

  const trendInfo = trendConfig[trend];

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      {/* Header row: score + trend */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Weekly Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-slate-900 dark:text-white">
              {weeklyScore.toFixed(0)}
              <span className="text-xl font-normal text-slate-400 ml-1">/100</span>
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 px-3 py-1 text-sm ${trendInfo.className}`}
            >
              {trendInfo.icon}
              {trendInfo.label}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Burnout warning */}
      {burnoutWarning && (
        <Card className="border border-red-500/40 bg-red-500/10 dark:bg-red-900/20">
          <CardContent className="flex items-start gap-3 pt-4 pb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-400 text-sm">Burnout Warning</p>
              <p className="text-sm text-slate-300 dark:text-slate-300 mt-0.5">
                {burnoutDetails ??
                  "You have been working intensely for several consecutive days with insufficient breaks."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week-over-week comparison */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Week-over-Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-left">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  Focus Hours
                </td>
                <td className="py-2 text-right">
                  <ChangeCell value={weekOverWeek.focusHoursChange} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  Sessions
                </td>
                <td className="py-2 text-right">
                  <ChangeCell value={weekOverWeek.sessionsChange} />
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700 dark:text-slate-300">
                  Avg Focus Score
                </td>
                <td className="py-2 text-right">
                  <ChangeCell value={weekOverWeek.avgScoreChange} />
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => {
              const cfg = severityConfig[insight.severity];
              return (
                <div
                  key={i}
                  className={`rounded-md border p-3 ${cfg.className}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${cfg.badgeClass}`}
                    >
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {insight.message}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-slate-400 text-right">
        Report generated{" "}
        {new Date(output.createdAt).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}
