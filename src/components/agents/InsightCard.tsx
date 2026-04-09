"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface InsightCardProps {
  title: string;
  message: string;
  priority: Priority;
  outputType: string;
  timestamp: Date | string;
  onDismiss?: () => void;
}

const priorityBadgeClass: Record<Priority, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function formatTimestamp(ts: Date | string): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InsightCard({
  title,
  message,
  priority,
  outputType,
  timestamp,
  onDismiss,
}: InsightCardProps) {
  return (
    <div className="rounded-md border border-slate-700/50 bg-slate-800/40 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${priorityBadgeClass[priority]}`}
          >
            {priority}
          </Badge>
          <span className="text-xs font-medium text-slate-300">{title}</span>
          <span className="text-[10px] text-slate-500 capitalize">
            {outputType.toLowerCase().replace(/_/g, " ")}
          </span>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-5 w-5 p-0 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      <p className="text-[10px] text-slate-500">{formatTimestamp(timestamp)}</p>
    </div>
  );
}
