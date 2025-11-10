"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  User,
  Timer,
  Target,
  AlertCircle
} from "lucide-react";
import { Project, Task } from "@/hooks/useProjects";
import TaskForm from "../tasks/TaskForm";

interface ProjectBoardProps {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  onCreateProject: (data: Partial<Project>) => Promise<void>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCreateTask: (data: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  searchTerm: string;
  filters: any;
}

const taskStatuses = [
  { id: 'TODO', name: 'To Do', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', name: 'Review', color: 'bg-yellow-500' },
  { id: 'DONE', name: 'Done', color: 'bg-green-500' }
];

const priorityColors = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
};

export default function ProjectBoard({
  projects,
  tasks,
  loading,
  onCreateProject,
  onCreateTask,
  onUpdateTask,
  searchTerm,
  filters
}: ProjectBoardProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormStatus, setTaskFormStatus] = useState<string>('TODO');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter tasks by selected project and search/filters
  const filteredTasks = tasks.filter(task => {
    if (selectedProject && task.projectId !== selectedProject) return false;
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    return true;
  });

  // Group tasks by status
  const tasksByStatus = taskStatuses.reduce((acc, status) => {
    acc[status.id] = filteredTasks.filter(task => task.status === status.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        await onUpdateTask(draggedTask.id, { status: newStatus as any });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
    setDraggedTask(null);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleCreateTask = (status: string) => {
    setTaskFormStatus(status);
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, taskData);
      } else {
        await onCreateTask({
          ...taskData,
          status: taskFormStatus as any,
          projectId: selectedProject || undefined
        });
      }
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskCancel = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {taskStatuses.map((status) => (
          <Card key={status.id} className="bg-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-8"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-slate-700 rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-slate-400 whitespace-nowrap" title="Select a project to view and manage its tasks">
            Project:
          </span>
          {projects.map((project) => (
            <Button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              variant={selectedProject === project.id ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap ${
                selectedProject === project.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {project.icon && <span className="mr-2">{project.icon}</span>}
              {project.title}
              <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                {project._count?.tasks || 0}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {taskStatuses.map((status) => (
          <Card 
            key={status.id} 
            className="bg-slate-900/50 border-slate-700/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <CardTitle className="text-sm font-medium text-slate-100">
                    {status.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                    {tasksByStatus[status.id]?.length || 0}
                  </Badge>
                  <Button
                    onClick={() => handleCreateTask(status.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100"
                    title={`Add task to ${status.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 min-h-[400px]">
              {tasksByStatus[status.id]?.map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-800/70 transition-colors cursor-move group"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Task Header */}
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-slate-100 text-sm leading-tight">
                          {task.title}
                        </h4>
                        <Button
                          onClick={() => handleEditTask(task)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit task"
                        >
                          <MoreHorizontal className="w-3 h-3 text-slate-400" />
                        </Button>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {/* Priority */}
                          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                          
                          {/* Due Date */}
                          {task.dueDate && (
                            <div className="flex items-center text-slate-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          )}
                        </div>

                        {/* Time Tracking */}
                        <div className="flex items-center space-x-2">
                          {task.estimatedMinutes && (
                            <div className="flex items-center text-slate-500">
                              <Target className="w-3 h-3 mr-1" />
                              {formatDuration(task.estimatedMinutes)}
                            </div>
                          )}
                          
                          {task.actualMinutes > 0 && (
                            <div className="flex items-center text-emerald-400">
                              <Timer className="w-3 h-3 mr-1" />
                              {formatDuration(task.actualMinutes)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-slate-700 text-slate-300 text-xs px-2 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge 
                              variant="secondary" 
                              className="bg-slate-700 text-slate-300 text-xs px-2 py-0"
                            >
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Progress Indicator */}
                      {task.estimatedMinutes && task.actualMinutes > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Progress</span>
                            <span>
                              {Math.round((task.actualMinutes / task.estimatedMinutes) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min((task.actualMinutes / task.estimatedMinutes) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {tasksByStatus[status.id]?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="text-sm">No tasks in {status.name.toLowerCase()}</p>
                  <Button
                    onClick={() => handleCreateTask(status.id)}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-slate-400 hover:text-slate-100"
                  >
                    Add task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Projects State */}
      {projects.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-100 mb-2">Welcome to Projects!</h3>
            <p className="text-slate-400 text-center mb-4 max-w-md">
              Create your first project to organize tasks, track progress, and connect your work to focus sessions. 
              Projects help you break down big goals into manageable tasks.
            </p>
            <Button
              onClick={() => onCreateProject({ title: "New Project", status: "ACTIVE", priority: "MEDIUM" })}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TaskForm
              onSubmit={handleTaskSubmit}
              onCancel={handleTaskCancel}
              initialData={editingTask ? {
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority,
                dueDate: editingTask.dueDate,
                tags: editingTask.tags,
                projectId: editingTask.projectId
              } : {}}
              isEditing={!!editingTask}
              loading={loading}
              projects={projects.map(p => ({
                id: p.id,
                title: p.title,
                color: p.color,
                icon: p.icon
              }))}
              selectedProjectId={selectedProject || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}