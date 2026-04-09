"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Suggestion {
  type: string;
  message: string;
  priority: Priority;
}

export interface CoachSuggestions {
  suggestions: Suggestion[];
  patterns: {
    trendDirection: string;
    consistencyScore: number;
  };
}

const priorityBadgeClass: Record<Priority, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

interface Props {
  /** Pass coachSuggestions from the session save response to show immediately */
  coachSuggestions?: CoachSuggestions | null;
}

export default function FocusCoachNotification({ coachSuggestions }: Props) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<CoachSuggestions | null>(null);
  // Track the last suggestions object we showed so we don't re-show on re-renders
  const shownRef = useRef<CoachSuggestions | null>(null);

  useEffect(() => {
    if (
      coachSuggestions &&
      coachSuggestions !== shownRef.current &&
      coachSuggestions.suggestions.length > 0
    ) {
      shownRef.current = coachSuggestions;
      setData(coachSuggestions);
      setVisible(true);
    }
  }, [coachSuggestions]);

  const handleDismiss = async () => {
    setVisible(false);
  };

  if (!visible || !data) return null;

  const { suggestions, patterns } = data;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="bg-slate-900/95 border-slate-700/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-100">
                Focus Coach
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Trend:{" "}
            <span
              className={
                patterns.trendDirection === "IMPROVING"
                  ? "text-green-400"
                  : patterns.trendDirection === "DECLINING"
                  ? "text-red-400"
                  : "text-slate-300"
              }
            >
              {patterns.trendDirection}
            </span>{" "}
            · Consistency: {patterns.consistencyScore}/100
          </p>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-400">No suggestions at this time.</p>
          ) : (
            suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-md bg-slate-800/60 border border-slate-700/40 p-2.5 space-y-1"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${priorityBadgeClass[s.priority as Priority]}`}
                >
                  {s.priority}
                </Badge>
                <p className="text-xs text-slate-300 leading-relaxed">{s.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
