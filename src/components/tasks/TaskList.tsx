"use client";

import { useState } from "react";
import { Task, Priority, TaskStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  SortAsc, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  ListTodo
} from "lucide-react";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  loading?: boolean;
}

export default function TaskList({ 
  tasks, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  loading = false 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
    const matchesPriority = filterPriority === "ALL" || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status for better organization
  const groupedTasks = {
    pending: filteredTasks.filter(task => task.status === "PENDING"),
    inProgress: filteredTasks.filter(task => task.status === "IN_PROGRESS"),
    completed: filteredTasks.filter(task => task.status === "COMPLETED"),
    cancelled: filteredTasks.filter(task => task.status === "CANCELLED")
  };

  const getStatusStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "COMPLETED").length;
    const pending = tasks.filter(task => task.status === "PENDING").length;
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === "COMPLETED") return false;
      return new Date(task.dueDate) < new Date();
    }).length;

    return { total, completed, pending, overdue };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <ListTodo className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <ListTodo className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
            <p className="text-sm text-slate-400">Total Tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats.pending}</p>
            <p className="text-sm text-slate-400">Pending</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <CheckSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats.completed}</p>
            <p className="text-sm text-slate-400">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{stats.overdue}</p>
            <p className="text-sm text-slate-400">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "ALL")}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as Priority | "ALL")}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-md text-white focus:border-cyan-500 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Lists */}
      {filteredTasks.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <ListTodo className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              {searchTerm || filterStatus !== "ALL" || filterPriority !== "ALL" 
                ? "No tasks match your filters" 
                : "No tasks yet"
              }
            </h3>
            <p className="text-slate-400">
              {searchTerm || filterStatus !== "ALL" || filterPriority !== "ALL"
                ? "Try adjusting your search or filters"
                : "Create your first task to get started"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Tasks (Pending + In Progress) */}
          {(groupedTasks.pending.length > 0 || groupedTasks.inProgress.length > 0) && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                Active Tasks ({groupedTasks.pending.length + groupedTasks.inProgress.length})
              </h2>
              <div className="space-y-3">
                {[...groupedTasks.pending, ...groupedTasks.inProgress].map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {groupedTasks.completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-green-400" />
                Completed Tasks ({groupedTasks.completed.length})
              </h2>
              <div className="space-y-3">
                {groupedTasks.completed.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}