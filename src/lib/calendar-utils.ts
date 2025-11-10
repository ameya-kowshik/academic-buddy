import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay
} from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'project' | 'task';
  date: Date;
  status: string;
  priority: string;
  color: string;
  project?: any;
  task?: any;
  isOverdue?: boolean;
  description?: string;
}

export const priorityColors = {
  LOW: '#64748b',      // slate-500
  MEDIUM: '#3b82f6',   // blue-500
  HIGH: '#f97316',     // orange-500
  URGENT: '#ef4444'    // red-500
};

export const statusColors = {
  // Project statuses
  PLANNING: '#64748b',   // slate-500
  ACTIVE: '#3b82f6',     // blue-500
  ON_HOLD: '#eab308',    // yellow-500
  COMPLETED: '#22c55e',  // green-500
  CANCELLED: '#ef4444',  // red-500
  // Task statuses
  TODO: '#64748b',       // slate-500
  IN_PROGRESS: '#3b82f6', // blue-500
  REVIEW: '#eab308',     // yellow-500
  DONE: '#22c55e'        // green-500
};

export const getCalendarDays = (currentDate: Date) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

export const generateCalendarEvents = (
  projects: any[] = [], 
  tasks: any[] = [], 
  showProjects: boolean = true, 
  showTasks: boolean = true,
  searchTerm: string = ""
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const today = startOfDay(new Date());

  // Add project events
  if (showProjects) {
    projects.forEach(project => {
      // Project due date
      if (project.dueDate) {
        const dueDate = typeof project.dueDate === 'string' ? parseISO(project.dueDate) : project.dueDate;
        if (isValid(dueDate)) {
          events.push({
            id: `project-due-${project.id}`,
            title: `📋 ${project.title}`,
            type: 'project',
            date: dueDate,
            status: project.status,
            priority: project.priority,
            color: project.color || priorityColors[project.priority as keyof typeof priorityColors],
            project,
            isOverdue: isBefore(startOfDay(dueDate), today) && project.status !== 'COMPLETED',
            description: project.description
          });
        }
      }

      // Project start date
      if (project.startDate && project.startDate !== project.dueDate) {
        const startDate = typeof project.startDate === 'string' ? parseISO(project.startDate) : project.startDate;
        if (isValid(startDate)) {
          events.push({
            id: `project-start-${project.id}`,
            title: `🚀 ${project.title} (Start)`,
            type: 'project',
            date: startDate,
            status: project.status,
            priority: project.priority,
            color: project.color || priorityColors[project.priority as keyof typeof priorityColors],
            project,
            description: `Project start date: ${project.description || ''}`
          });
        }
      }
    });
  }

  // Add task events
  if (showTasks) {
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
        if (isValid(dueDate)) {
          const project = projects.find(p => p.id === task.projectId);
          events.push({
            id: `task-${task.id}`,
            title: `✅ ${task.title}`,
            type: 'task',
            date: dueDate,
            status: task.status,
            priority: task.priority,
            color: project?.color || priorityColors[task.priority as keyof typeof priorityColors],
            task,
            project,
            isOverdue: isBefore(startOfDay(dueDate), today) && task.status !== 'DONE',
            description: task.description
          });
        }
      }
    });
  }

  // Filter events based on search term
  if (searchTerm) {
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  return events;
};

export const getEventsForDate = (events: CalendarEvent[], date: Date) => {
  return events.filter(event => isSameDay(event.date, date));
};

export const getEventsForDateRange = (events: CalendarEvent[], startDate: Date, endDate: Date) => {
  return events.filter(event => {
    const eventDate = startOfDay(event.date);
    return (isSameDay(eventDate, startDate) || isAfter(eventDate, startDate)) &&
           (isSameDay(eventDate, endDate) || isBefore(eventDate, endDate));
  });
};

export const getUpcomingEvents = (events: CalendarEvent[], days: number = 7) => {
  const today = startOfDay(new Date());
  const futureDate = endOfDay(addMonths(today, 0));
  futureDate.setDate(futureDate.getDate() + days);
  
  return events
    .filter(event => {
      const eventDate = startOfDay(event.date);
      return (isSameDay(eventDate, today) || isAfter(eventDate, today)) &&
             (isSameDay(eventDate, futureDate) || isBefore(eventDate, futureDate));
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const getOverdueEvents = (events: CalendarEvent[]) => {
  const today = startOfDay(new Date());
  
  return events
    .filter(event => event.isOverdue)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const formatEventDate = (date: Date, includeTime: boolean = false) => {
  if (includeTime) {
    return format(date, 'PPp');
  }
  return format(date, 'PP');
};

export const getEventsByStatus = (events: CalendarEvent[], status: string) => {
  return events.filter(event => event.status === status);
};

export const getEventsByPriority = (events: CalendarEvent[], priority: string) => {
  return events.filter(event => event.priority === priority);
};

export const getEventsByType = (events: CalendarEvent[], type: 'project' | 'task') => {
  return events.filter(event => event.type === type);
};