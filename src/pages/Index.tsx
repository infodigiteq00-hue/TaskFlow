import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import { TeamChat } from '@/components/chat/TeamChat';
import { CompanyList } from '@/components/companies/CompanyList';
import { TeamList } from '@/components/team/TeamList';
import { LinkedInManager } from '@/components/linkedin/LinkedInManager';
import { ReportsView } from '@/components/reports/ReportsView';
import { Task, TASK_CATEGORIES, CategoryOption, Company, TeamMember } from '@/types/task';
import { mockTasks, mockTeamMembers, mockCompanies } from '@/data/mockData';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { cn } from '@/lib/utils';

const CUSTOM_CATEGORIES_KEY = 'taskflow-custom-categories';

const defaultCategories: CategoryOption[] = TASK_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

const viewTitles: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of all your tasks and projects' },
  tasks: { title: 'All Tasks', subtitle: 'View and manage all tasks' },
  linkedin: { title: 'LinkedIn Management', subtitle: 'Manage weekly posts for clients' },
  companies: { title: 'Companies', subtitle: 'Manage your client companies' },
  team: { title: 'Team', subtitle: 'Manage your team members' },
  chat: { title: 'Team Chat', subtitle: 'Communicate with your team' },
  reports: { title: 'Reports', subtitle: 'Performance analytics' },
  settings: { title: 'Settings', subtitle: 'Configure your preferences' },
};

export default function Index() {
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialCategoryForNewTask, setInitialCategoryForNewTask] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customCategories, setCustomCategories] = useState<CategoryOption[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (raw) return JSON.parse(raw) as CategoryOption[];
    } catch {
      // ignore
    }
    return [];
  });

  const categories: CategoryOption[] = [...defaultCategories, ...customCategories];

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
    } catch {
      // ignore
    }
  }, [customCategories]);

  const handleAddCategory = (category: CategoryOption) => {
    setCustomCategories((prev) => [...prev, category]);
  };

  const handleEditCategory = (value: string, newLabel: string) => {
    setCustomCategories((prev) =>
      prev.map((c) => (c.value === value ? { ...c, label: newLabel } : c))
    );
  };

  const handleDeleteCategory = (value: string) => {
    setCustomCategories((prev) => prev.filter((c) => c.value !== value));
  };

  const customCategoryValues = new Set(customCategories.map((c) => c.value));

  useReminderScheduler(tasks);

  const handleOpenNewTask = (categoryValue?: string) => {
    setInitialCategoryForNewTask(categoryValue ?? null);
    setEditingTask(null);
    setIsNewTaskOpen(true);
  };

  const handleCloseTaskDialog = (open: boolean) => {
    if (!open) {
      setIsNewTaskOpen(false);
      setEditingTask(null);
      setInitialCategoryForNewTask(null);
    }
  };

  const handleAddCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company]);
  };

  const handleAddTeamMember = (member: TeamMember) => {
    setTeamMembers((prev) => [...prev, member]);
  };

  const handleUpdateCompany = (company: Company) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, ...company } : c))
    );
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  };

  const handleNewTask = (taskData: Task) => {
    setTasks((prev) => [taskData, ...prev]);
  };

  const handleUpdateTask = (task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, ...task, updatedAt: new Date().toISOString() } : t
      )
    );
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
    // TODO: Open task detail modal
  };

  const viewConfig = viewTitles[activeView] || viewTitles.dashboard;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            categories={categories}
            customCategoryValues={customCategoryValues}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onUpdateTask={handleUpdateTask}
            onNewTask={handleOpenNewTask}
            onEditTask={(task) => setEditingTask(task)}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'tasks':
        return <TaskBoard tasks={tasks} teamMembers={teamMembers} onTaskClick={handleTaskClick} />;
      case 'linkedin':
        return (
          <LinkedInManager
            tasks={tasks}
            companies={companies}
            onTaskClick={handleTaskClick}
            onAddLinkedInPost={handleNewTask}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
            onUpdateTask={handleUpdateTask}
          />
        );
      case 'companies':
        return <CompanyList companies={companies} tasks={tasks} />;
      case 'team':
        return <TeamList teamMembers={teamMembers} tasks={tasks} onAddMember={handleAddTeamMember} />;
      case 'chat':
        return <TeamChat />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Settings coming soon...
          </div>
        );
      default:
        return (
          <Dashboard
            tasks={tasks}
            categories={categories}
            customCategoryValues={customCategoryValues}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onUpdateTask={handleUpdateTask}
            onNewTask={handleOpenNewTask}
            onEditTask={(task) => setEditingTask(task)}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewTask={() => handleOpenNewTask()}
      />
      
      <main className={cn(
        'transition-all duration-300',
        'ml-64' // Sidebar width
      )}>
        <Header {...viewConfig} />
        <div className="p-6">
          {renderView()}
        </div>
      </main>

      <NewTaskDialog
        open={isNewTaskOpen || !!editingTask}
        onOpenChange={handleCloseTaskDialog}
        onSubmit={handleNewTask}
        categoryOptions={categories}
        companies={companies}
        onAddCompany={handleAddCompany}
        editTask={editingTask}
        onUpdateTask={handleUpdateTask}
        initialCategory={initialCategoryForNewTask ?? undefined}
        teamMembers={teamMembers}
      />
    </div>
  );
}
