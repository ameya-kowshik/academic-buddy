"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Filter,
  Eye,
  EyeOff,
  Target,
  ListTodo
} from "lucide-react";
import { format, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from "date-fns";
import { Project, Task } from "@/hooks/useProjects";
import { 
  CalendarEvent,
  priorityColors,
  statusColors,
  getCalendarDays,
  generateCalendarEvents,
  getEventsForDate,
  formatEventDate
} from "@/lib/calendar-utils";

interface ProjectCalendarProps {
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



export default function ProjectCalendar({
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
}: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showProjects, setShowProjects] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Generate calendar events from projects and tasks
  const calendarEvents = useMemo(() => {
    return generateCalendarEvents(projects, tasks, showProjects, showTasks, searchTerm);
  }, [projects, tasks, showProjects, showTasks, searchTerm]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate);
  }, [currentDate]);

  // Get events for a specific date
  const getDateEvents = (date: Date) => {
    return getEventsForDate(calendarEvents, date);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event status icon
  const getStatusIcon = (event: CalendarEvent) => {
    if (event.type === 'project') {
      switch (event.status) {
        case 'COMPLETED':
          return <CheckCircle2 className="w-3 h-3 text-green-400" />;
        case 'ACTIVE':
          return <Target className="w-3 h-3 text-blue-400" />;
        case 'ON_HOLD':
          return <Clock className="w-3 h-3 text-yellow-400" />;
        default:
          return <Circle className="w-3 h-3 text-slate-400" />;
      }
    } else {
      switch (event.status) {
        case 'DONE':
          return <CheckCircle2 className="w-3 h-3 text-green-400" />;
        case 'IN_PROGRESS':
          return <ListTodo className="w-3 h-3 text-blue-400" />;
        case 'REVIEW':
          return <Clock className="w-3 h-3 text-yellow-400" />;
        default:
          return <Circle className="w-3 h-3 text-slate-400" />;
      }
    }
  };

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
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-xl font-semibold text-slate-100">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  onClick={goToPreviousMonth}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={goToToday}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-3"
                >
                  Today
                </Button>
                <Button
                  onClick={goToNextMonth}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Toggles */}
              <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                <Button
                  onClick={() => setShowProjects(!showProjects)}
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${showProjects ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}
                >
                  {showProjects ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Projects
                </Button>
                <Button
                  onClick={() => setShowTasks(!showTasks)}
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${showTasks ? 'bg-slate-700 text-slate-100' : 'text-slate-400'}`}
                >
                  {showTasks ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Tasks
                </Button>
              </div>

              <Button
                onClick={() => onCreateProject?.({})}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-slate-800/30 rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              const dayEvents = getDateEvents(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[120px] p-2 bg-slate-900/50 hover:bg-slate-800/50 cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${isDayToday ? 'ring-2 ring-cyan-400/50' : ''}
                    ${isSelected ? 'bg-slate-800' : ''}
                  `}
                >
                  {/* Day Number */}
                  <div className={`
                    text-sm font-medium mb-1 flex items-center justify-between
                    ${isDayToday ? 'text-cyan-400' : isCurrentMonth ? 'text-slate-100' : 'text-slate-500'}
                  `}>
                    <span>{format(day, 'd')}</span>
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-slate-400">+{dayEvents.length - 3}</span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className={`
                          text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity
                          flex items-center space-x-1
                          ${event.isOverdue ? 'ring-1 ring-red-400/50' : ''}
                        `}
                        style={{ backgroundColor: event.color }}
                      >
                        {getStatusIcon(event)}
                        <span className="truncate">{event.title.replace(/^[📋🚀✅]\s/, '')}</span>
                        {event.isOverdue && <AlertCircle className="w-3 h-3 text-red-200 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getDateEvents(selectedDate).length === 0 ? (
              <p className="text-slate-400 text-center py-4">No events scheduled for this day</p>
            ) : (
              <div className="space-y-3">
                {getDateEvents(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(event)}
                          <span className="font-medium text-slate-100">{event.title.replace(/^[📋🚀✅]\s/, '')}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          {event.isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {event.project && event.type === 'task' && (
                          <p className="text-sm text-slate-400 mt-1">
                            Project: {event.project.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-slate-700 max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-100">
                  {selectedEvent.title}
                </CardTitle>
                <Button
                  onClick={() => setSelectedEvent(null)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-100"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{selectedEvent.type}</Badge>
                <Badge 
                  variant="outline" 
                  style={{ 
                    backgroundColor: statusColors[selectedEvent.status as keyof typeof statusColors],
                    color: 'white',
                    borderColor: 'transparent'
                  }}
                >
                  {selectedEvent.status}
                </Badge>
                <Badge variant="outline">{selectedEvent.priority}</Badge>
              </div>

              <div>
                <p className="text-sm text-slate-400">Due Date</p>
                <p className="text-slate-100">{formatEventDate(selectedEvent.date)}</p>
              </div>

              {selectedEvent.project && selectedEvent.type === 'task' && (
                <div>
                  <p className="text-sm text-slate-400">Project</p>
                  <p className="text-slate-100">{selectedEvent.project.title}</p>
                </div>
              )}

              {selectedEvent.task?.description && (
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="text-slate-100">{selectedEvent.task.description}</p>
                </div>
              )}

              {selectedEvent.project?.description && selectedEvent.type === 'project' && (
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="text-slate-100">{selectedEvent.project.description}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => {
                    // Handle edit action
                    setSelectedEvent(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setSelectedEvent(null)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}