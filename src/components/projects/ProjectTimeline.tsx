"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface ProjectTimelineProps {
  projects?: any[];
  tasks?: any[];
  loading?: boolean;
  onCreateProject?: (data: any) => Promise<void>;
  onUpdateProject?: (id: string, data: any) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onCreateTask?: (data: any) => Promise<void>;
  onUpdateTask?: (id: string, data: any) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
  searchTerm?: string;
  filters?: any;
}

export default function ProjectTimeline(props: ProjectTimelineProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Timeline View</h3>
        <p className="text-slate-400 text-center">
          Gantt chart and project timeline coming soon
        </p>
      </CardContent>
    </Card>
  );
}