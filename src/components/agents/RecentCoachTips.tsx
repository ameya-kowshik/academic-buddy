"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type TrendDirection = "IMPROVING" | "DECLINING" | "STABLE";

interface Suggestion {
  type: string;
  message: string;
  priority: Priority;
}

interface FocusCoachContent {
  suggestions: Suggestion[];
  patterns: {
    trendDirection: TrendDirection;
    consistencyScore: number;
  };
}

interface AgentOutputRecord {
  id: string;
  content: FocusCoachContent;
  createdAt: string;
  dismissed: boolean;
}

const priorityBadgeClass: Record<Priority, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const trendBadgeClass: Record<TrendDirection, string> = {
  IMPROVING: "bg-green-500/20 text-green-400 border-green-500/30",
  DECLINING: "bg-red-500/20 text-red-400 border-red-500/30",
  STABLE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  if (direction === "IMPROVING") return <TrendingUp className="w-3 h-3" />;
  if (direction === "DECLINING") return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function RecentCoachTips() {
  const [outputs, setOutputs] = useState<AgentOutputRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutputs = async () => {
      try {
        const res = await fetch("/api/agents/outputs?agentId=focus-coach&limit=10");
        if (!res.ok) return;
        const data = await res.json();
        const records: AgentOutputRecord[] = data.outputs ?? [];
        setOutputs(records.filter((r) => !r.dismissed));
      } catch {
        // Silently ignore — section is non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchOutputs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-slate-800/40 border border-slate-700/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-slate-800/60 rounded-full flex items-center justify-center mb-3">
          <Brain className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium">No coach tips yet</p>
        <p className="text-slate-500 text-xs mt-1">
          Complete a focus session to receive personalized suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {outputs.map((record) => {
        const { suggestions, patterns } = record.content;
        return (
          <div
            key={record.id}
            className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-4 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500">
                {formatRelativeTime(record.createdAt)}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${trendBadgeClass[patterns.trendDirection]}`}
              >
                <TrendIcon direction={patterns.trendDirection} />
                {patterns.trendDirection}
              </Badge>
            </div>

            {/* Suggestions */}
            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-400">No suggestions recorded.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${priorityBadgeClass[s.priority]}`}
                    >
                      {s.priority}
                    </Badge>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
