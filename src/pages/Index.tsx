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
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppState } from '@/hooks/useAppState';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { cn } from '@/lib/utils';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const state = useAppState();
  const currentUser = user
    ? { id: user.id, name: (user.user_metadata?.full_name as string) || user.email || 'User' }
    : undefined;
  const {
    dataLoading,
    activeView,
    setActiveView,
    tasks,
    companies,
    teamMembers,
    chatMessages,
    categories,
    customCategoryValues,
    isNewTaskOpen,
    editingTask,
    setEditingTask,
    initialCategoryForNewTask,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleOpenNewTask,
    handleCloseTaskDialog,
    handleAddCompany,
    handleAddTeamMember,
    handleUpdateCompany,
    handleDeleteCompany,
    handleNewTask,
    handleUpdateTask,
    handleTaskClick,
    handleSendChatMessage,
  } = state;

  useReminderScheduler(tasks);

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
            onEditTask={setEditingTask}
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
        return (
          <TeamChat
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUser={currentUser}
          />
        );
      case 'reports':
        return (
          <ReportsView
            tasks={tasks}
            teamMembers={teamMembers}
            companies={companies}
          />
        );
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
            onEditTask={setEditingTask}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-sm sm:text-base text-muted-foreground">Loading your data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewTask={() => handleOpenNewTask()}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'ml-0 lg:ml-64'
        )}
      >
        <Header {...viewConfig} onMenuClick={() => setMobileSidebarOpen(true)} />
        <div className="p-4 sm:p-5 md:p-6">
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
