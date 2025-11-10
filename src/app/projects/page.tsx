"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  ListTodo, 
  AlertCircle,
  LayoutGrid,
  Table,
  Calendar,
  BarChart3,
  Filter,
  Search,
  SortAsc
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

// Hooks
import { useProjects } from "../../hooks/useProjects";

// Components
import ProjectBoard from "../../components/projects/ProjectBoard";
import ProjectTable from "../../components/projects/ProjectTable";
import ProjectCalendar from "../../components/projects/ProjectCalendar";
import ProjectTimeline from "../../components/projects/ProjectTimeline";
import ProjectForm from "../../components/projects/ProjectForm";
import ProjectFilters from "../../components/projects/ProjectFilters";

function ProjectsPageContent() {
  const {
    projects,
    tasks,
    loading: projectsLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    clearError
  } = useProjects();

  const [activeView, setActiveView] = useState("board");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    assignee: "all"
  });

  const views = [
    { id: "board", name: "Board", icon: LayoutGrid, description: "Kanban view" },
    { id: "table", name: "Table", icon: Table, description: "Database view" },
    { id: "calendar", name: "Calendar", icon: Calendar, description: "Timeline view" },
    { id: "timeline", name: "Timeline", icon: BarChart3, description: "Gantt view" }
  ];

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject(projectData);
      setShowCreateProject(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const renderActiveView = () => {
    const commonProps = {
      projects,
      tasks,
      loading: projectsLoading,
      onCreateProject: handleCreateProject,
      onUpdateProject: updateProject,
      onDeleteProject: deleteProject,
      onCreateTask: createTask,
      onUpdateTask: updateTask,
      onDeleteTask: deleteTask,
      searchTerm,
      filters
    };

    switch (activeView) {
      case "board":
        return <ProjectBoard {...commonProps} />;
      case "table":
        return <ProjectTable {...commonProps} />;
      case "calendar":
        return <ProjectCalendar {...commonProps} />;
      case "timeline":
        return <ProjectTimeline {...commonProps} />;
      default:
        return <ProjectBoard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Projects</h1>
                <p className="text-sm text-slate-400">Notion-style project management with focus integration</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>

              <Button
                onClick={() => setShowCreateProject(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
                title="Create a new project"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-900/50 border border-slate-700/50">
                {views.map((view) => (
                  <TabsTrigger 
                    key={view.id}
                    value={view.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-300 hover:text-slate-100 transition-all duration-300"
                  >
                    <view.icon className="w-4 h-4 mr-2" />
                    {view.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Search and Sort */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-slate-300 placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 focus:outline-none"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
                >
                  <SortAsc className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Active View */}
        <div className="space-y-6">
          {renderActiveView()}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateProject && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateProject(false)}
          loading={projectsLoading}
        />
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AppLayout>
      <ProjectsPageContent />
    </AppLayout>
  );
}