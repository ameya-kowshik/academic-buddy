"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Task } from "@prisma/client";
import { taskUtils } from "@/lib/tasks";
import Link from "next/link";

interface TaskSelectorProps {
  tasks: Task[];
  selectedTaskId?: string | null;
  onSelectTask: (taskId: string | null) => void;
  loading?: boolean;
}

export default function TaskSelector({
  tasks,
  selectedTaskId,
  onSelectTask,
  loading = false
}: TaskSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show active tasks first (pending, in progress), then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { PENDING: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 };
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    // First by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });

  // Show first 5 tasks by default
  const visibleTasks = showAll ? sortedTasks : sortedTasks.slice(0, 5);
  const hasMoreTasks = sortedTasks.length > 5;

  const getTaskIcon = (task: Task) => {
    if (task.status === "COMPLETED") return "✅";
    if (task.status === "IN_PROGRESS") return "⏳";
    if (taskUtils.isOverdue(task)) return "⚠️";
    return "📝";
  };

  const getTaskStatusColor = (task: Task) => {
    if (task.status === "COMPLETED") return "text-green-400";
    if (task.status === "IN_PROGRESS") return "text-blue-400";
    if (taskUtils.isOverdue(task)) return "text-red-400";
    return "text-slate-400";
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-300">Link to Task (Optional)</h3>
          </div>
          
          <Link href="/tasks">
            <Button
              size="sm"
              variant="outline"
              className="bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Manage
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {/* Search */}
          {tasks.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          )}

          {/* No Task Option */}
          <button
            onClick={() => onSelectTask(null)}
            disabled={loading}
            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedTaskId === null
                ? 'border-slate-500 bg-slate-800/50 text-slate-200'
                : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/30'
            } disabled:opacity-50`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎯</span>
              <div>
                <div className="text-sm font-medium">Free Focus Session</div>
                <div className="text-xs text-slate-500">Not linked to any specific task</div>
              </div>
            </div>
          </button>

          {/* Task Options */}
          {visibleTasks.length > 0 ? (
            <div className="space-y-2">
              {visibleTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedTaskId === task.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-slate-200'
                      : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/30'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">{getTaskIcon(task)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-200 truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${taskUtils.getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${getTaskStatusColor(task)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        
                        {task.dueDate && (
                          <span className={`text-xs ${taskUtils.isOverdue(task) ? 'text-red-400' : 'text-slate-500'}`}>
                            {taskUtils.formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks available</p>
              <p className="text-xs mt-1">Create tasks to link focus sessions</p>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              <p className="text-sm">No tasks match your search</p>
            </div>
          )}

          {/* Show More/Less Button */}
          {hasMoreTasks && (
            <Button
              onClick={() => setShowAll(!showAll)}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            >
              {showAll ? `Show Less` : `Show ${sortedTasks.length - 5} More`}
            </Button>
          )}
        </div>

        {/* Selected Task Info */}
        {selectedTaskId && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            {(() => {
              const selectedTask = tasks.find(task => task.id === selectedTaskId);
              return selectedTask ? (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-400">Linked to:</span>
                  <span className="text-lg">{getTaskIcon(selectedTask)}</span>
                  <span className="text-cyan-400 font-medium truncate">
                    {selectedTask.title}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}