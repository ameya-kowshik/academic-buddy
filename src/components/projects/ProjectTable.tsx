"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  Filter,
  Download,
  Eye
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Project, Task } from "@/hooks/useProjects";

interface ProjectTableProps {
  projects?: Project[];
  tasks?: Task[];
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

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'progress' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'projects' | 'tasks';

const priorityColors = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
};

const statusColors = {
  // Project statuses
  PLANNING: 'bg-slate-500',
  ACTIVE: 'bg-blue-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  // Task statuses
  TODO: 'bg-slate-500',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500'
};

export default function ProjectTable({
  projects = [],
  tasks = [],
  loading = false,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  searchTerm = "",
  filters = {}
}: ProjectTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowItemMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let items: (Project | Task)[] = [];

    // Add projects if viewing projects
    if (viewMode === 'projects') {
      items = [...items, ...projects];
    }

    // Add tasks if viewing tasks
    if (viewMode === 'tasks') {
      items = [...items, ...tasks];
    }

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      items = items.filter(item => item.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      items = items.filter(item => item.priority === filters.priority);
    }

    // Sort items
    items.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'dueDate':
          aValue = 'dueDate' in a && a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = 'dueDate' in b && b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return items;
  }, [projects, tasks, searchTerm, filters, sortField, sortDirection, viewMode]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getStatusIcon = (status: string, type: 'project' | 'task') => {
    if (type === 'project') {
      switch (status) {
        case 'COMPLETED':
          return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        case 'ACTIVE':
          return <Target className="w-4 h-4 text-blue-400" />;
        case 'ON_HOLD':
          return <Clock className="w-4 h-4 text-yellow-400" />;
        default:
          return <Circle className="w-4 h-4 text-slate-400" />;
      }
    } else {
      switch (status) {
        case 'DONE':
          return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        case 'IN_PROGRESS':
          return <Target className="w-4 h-4 text-blue-400" />;
        case 'REVIEW':
          return <Clock className="w-4 h-4 text-yellow-400" />;
        default:
          return <Circle className="w-4 h-4 text-slate-400" />;
      }
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, 'MMM d, yyyy') : '-';
  };

  const getProgress = (item: Project | Task) => {
    if ('tasks' in item) {
      // Project progress based on completed tasks
      const totalTasks = item._count?.tasks || 0;
      if (totalTasks === 0) return 0;
      const completedTasks = item.tasks?.filter(t => t.status === 'DONE').length || 0;
      return Math.round((completedTasks / totalTasks) * 100);
    } else {
      // Task progress based on status
      switch (item.status) {
        case 'DONE': return 100;
        case 'IN_PROGRESS': return 50;
        case 'REVIEW': return 75;
        default: return 0;
      }
    }
  };

  const isProject = (item: Project | Task): item is Project => {
    // Check if item has project-specific properties
    // Projects have 'estimatedHours' and 'actualHours', tasks have 'estimatedMinutes' and 'actualMinutes'
    return 'estimatedHours' in item || 'actualHours' in item;
  };

  const handleEditItem = (item: Project | Task) => {
    // This would open the appropriate form modal
    console.log('Edit item:', item);
    setShowItemMenu(null);
  };

  const handleDeleteItem = async (item: Project | Task) => {
    const itemType = isProject(item) ? 'project' : 'task';
    const confirmMessage = `Are you sure you want to delete this ${itemType}?${
      itemType === 'project' ? ' This will also delete all associated tasks.' : ''
    }`;
    
    if (window.confirm(confirmMessage)) {
      try {
        if (isProject(item)) {
          await onDeleteProject?.(item.id);
        } else {
          await onDeleteTask?.(item.id);
        }
        setShowItemMenu(null);
      } catch (error) {
        console.error(`Failed to delete ${itemType}:`, error);
      }
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800"
    >
      <span className="flex items-center space-x-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </Button>
  );

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={menuRef}>
      {/* Table Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-100">
              Database View
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('projects')}
                  variant="ghost"
                  size="sm"
                  className={`text-xs transition-all duration-300 ${
                    viewMode === 'projects' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  Projects
                </Button>
                <Button
                  onClick={() => setViewMode('tasks')}
                  variant="ghost"
                  size="sm"
                  className={`text-xs transition-all duration-300 ${
                    viewMode === 'tasks' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  Tasks
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 hover:border-slate-500 transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>

              <Button
                onClick={() => onCreateProject?.({})}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700/50">
                <tr className="text-left">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredData.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                    />
                  </th>
                  <th className="p-4">
                    <SortButton field="title">
                      <span>Name</span>
                    </SortButton>
                  </th>
                  <th className="p-4">Type</th>
                  <th className="p-4">
                    <SortButton field="status">
                      <span>Status</span>
                    </SortButton>
                  </th>
                  <th className="p-4">
                    <SortButton field="priority">
                      <span>Priority</span>
                    </SortButton>
                  </th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">
                    <SortButton field="dueDate">
                      <span>Due Date</span>
                    </SortButton>
                  </th>
                  <th className="p-4">
                    <SortButton field="createdAt">
                      <span>Created</span>
                    </SortButton>
                  </th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const itemIsProject = isProject(item);
                  const isExpanded = expandedProjects.includes(item.id);
                  const progress = getProgress(item);
                  const isOverdue = 'dueDate' in item && item.dueDate && 
                    new Date(item.dueDate) < new Date() && 
                    item.status !== (itemIsProject ? 'COMPLETED' : 'DONE');

                  return (
                    <tr 
                      key={item.id} 
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {itemIsProject && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProjectExpansion(item.id)}
                              className="p-0 h-auto text-slate-400 hover:text-slate-100"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </Button>
                          )}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: itemIsProject ? (item as Project).color || priorityColors[item.priority] : priorityColors[item.priority] }}
                          />
                          <div>
                            <div className="font-medium text-slate-100 flex items-center space-x-2">
                              <span>{item.title}</span>
                              {isOverdue && <AlertCircle className="w-4 h-4 text-red-400" />}
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-400 truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {itemIsProject ? 'Project' : 'Task'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status, itemIsProject ? 'project' : 'task')}
                          <Badge 
                            variant="outline"
                            className="text-xs"
                            style={{ 
                              backgroundColor: statusColors[item.status as keyof typeof statusColors],
                              color: 'white',
                              borderColor: 'transparent'
                            }}
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline"
                          className="text-xs"
                          style={{ 
                            backgroundColor: priorityColors[item.priority as keyof typeof priorityColors],
                            color: 'white',
                            borderColor: 'transparent'
                          }}
                        >
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">
                            {formatDate('dueDate' in item ? item.dueDate : undefined)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <Button
                            onClick={() => setShowItemMenu(showItemMenu === item.id ? null : item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          
                          {showItemMenu === item.id && (
                            <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                                >
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Table className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">No items found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first project or task to get started'}
              </p>
              <Button
                onClick={() => onCreateProject?.({})}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => {
                    // Bulk edit functionality - could open a bulk edit modal
                    console.log('Bulk edit:', selectedItems);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-500 transition-all duration-300"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`)) {
                      try {
                        // Delete selected items
                        for (const itemId of selectedItems) {
                          const item = filteredData.find(i => i.id === itemId);
                          if (item) {
                            if (isProject(item)) {
                              await onDeleteProject?.(item.id);
                            } else {
                              await onDeleteTask?.(item.id);
                            }
                          }
                        }
                        setSelectedItems([]);
                      } catch (error) {
                        console.error('Failed to delete items:', error);
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}