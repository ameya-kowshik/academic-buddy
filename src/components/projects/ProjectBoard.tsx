"use client";

import { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  Edit,
  Trash2,
  Settings,
  ChevronDown
} from "lucide-react";
import { Project, Task } from "@/hooks/useProjects";
import TaskForm from "../tasks/TaskForm";
import ProjectForm from "./ProjectForm";

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
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
};

export default function ProjectBoard({
  projects,
  tasks,
  loading,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
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
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(null);
        setShowTaskMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
    setShowProjectMenu(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      try {
        await onDeleteProject(projectId);
        // If we deleted the selected project, select another one or null
        if (selectedProject === projectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId);
          setSelectedProject(remainingProjects.length > 0 ? remainingProjects[0].id : null);
        }
        setShowProjectMenu(null);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDeleteTask(taskId);
        setShowTaskMenu(null);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleProjectSubmit = async (projectData: Partial<Project>) => {
    try {
      if (editingProject) {
        await onUpdateProject(editingProject.id, projectData);
      } else {
        await onCreateProject(projectData);
      }
      setShowProjectForm(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleProjectCancel = () => {
    setShowProjectForm(false);
    setEditingProject(null);
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
    <div className="space-y-6" ref={menuRef}>
      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-400" title="Select a project to view and manage its tasks">
              Project:
            </span>
            <div className="flex items-center space-x-2 flex-wrap">
              {projects.map((project) => (
                <div key={project.id} className="relative flex items-center">
                  <Button
                    onClick={() => setSelectedProject(project.id)}
                    variant={selectedProject === project.id ? "default" : "outline"}
                    size="sm"
                    className={`${
                      selectedProject === project.id
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:border-cyan-400/50'
                    } transition-all duration-300`}
                  >
                    {project.icon && <span className="mr-2">{project.icon}</span>}
                    {project.title}
                    <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                      {project._count?.tasks || 0}
                    </Badge>
                  </Button>
                  
                  {/* Project Menu */}
                  <div className="relative ml-1">
                    <Button
                      onClick={() => setShowProjectMenu(showProjectMenu === project.id ? null : project.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all duration-300"
                      title="Project options"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    
                    {showProjectMenu === project.id && (
                      <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-20 min-w-[160px]">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setSelectedProject(project.id);
                              setShowProjectMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                          >
                            <Target className="w-3 h-3 mr-2" />
                            View Tasks
                          </button>
                          <button
                            onClick={() => handleEditProject(project)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit Project
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete Project
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Add Project Button */}
          <Button
            onClick={() => {
              setEditingProject(null);
              setShowProjectForm(true);
            }}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02]"
            size="sm"
            title="Create new project"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Project
          </Button>
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
                        <div className="relative">
                          <Button
                            onClick={() => setShowTaskMenu(showTaskMenu === task.id ? null : task.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Task options"
                          >
                            <MoreHorizontal className="w-3 h-3 text-slate-400" />
                          </Button>
                          
                          {showTaskMenu === task.id && (
                            <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleEditTask(task);
                                    setShowTaskMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                                >
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={editingProject || undefined}
          onSubmit={handleProjectSubmit}
          onCancel={handleProjectCancel}
          loading={loading}
        />
      )}
    </div>
  );
}