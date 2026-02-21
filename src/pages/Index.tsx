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
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppState } from '@/hooks/useAppState';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { ReminderPopup } from '@/components/reminder/ReminderPopup';
import { getAndConsumeNextMissed } from '@/lib/reminderStorage';
import { cn } from '@/lib/utils';
import { getSeenByIds, type Task, type TaskReminder } from '@/types/task';

const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

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
  const [activeReminder, setActiveReminder] = useState<{
    task: Task;
    reminder: TaskReminder;
  } | null>(null);
  const snoozeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    onlineCount,
    chatMessages,
    unreadChatCount,
    markChatAsRead,
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
    handleUpdateTeamMember,
    handleDeleteTeamMember,
    handleUpdateCompany,
    handleDeleteCompany,
    handleNewTask,
    handleUpdateTask,
    handleTaskClick,
    handleSendChatMessage,
    handleUpdateChatMessage,
    handleDeleteChatMessage,
    handleToggleReaction,
    handleMarkMessagesAsSeen,
  } = state;

  // When tab becomes visible (or on load), show any reminder that fired while tab was background/closed
  const checkMissedReminders = useCallback(() => {
    getAndConsumeNextMissed().then((stored) => {
      if (stored) setActiveReminder({ task: stored.task, reminder: stored.reminder });
    });
  }, []);

  const handleReminderNotifyLater = useCallback(() => {
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    const current = activeReminder;
    setActiveReminder(null);
    if (current) {
      snoozeTimeoutRef.current = setTimeout(() => {
        setActiveReminder({ task: current.task, reminder: current.reminder });
        snoozeTimeoutRef.current = null;
      }, SNOOZE_MS);
    }
    checkMissedReminders();
  }, [activeReminder, checkMissedReminders]);

  const handleReminderDontShowAgain = useCallback(() => {
    if (snoozeTimeoutRef.current) {
      clearTimeout(snoozeTimeoutRef.current);
      snoozeTimeoutRef.current = null;
    }
    if (activeReminder) {
      handleUpdateTask({ ...activeReminder.task, reminder: undefined });
      setActiveReminder(null);
    }
    checkMissedReminders();
  }, [activeReminder, handleUpdateTask, checkMissedReminders]);

  useReminderScheduler(tasks, useCallback((task: Task, reminder: TaskReminder) => {
    setActiveReminder({ task, reminder });
  }, []));

  useEffect(() => () => {
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
  }, []);

  // On mount and when tab becomes visible, show any missed reminders (e.g. tab was closed or background)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkMissedReminders();
    };
    document.addEventListener('visibilitychange', onVisible);
    checkMissedReminders();
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [checkMissedReminders]);

  const viewConfig = viewTitles[activeView] || viewTitles.dashboard;

  // Mark chat as read when user is on Team Chat view
  useEffect(() => {
    if (activeView === 'chat') markChatAsRead();
  }, [activeView, markChatAsRead]);

  // Mark messages as seen when user is viewing Team Chat (after a short delay; use ref so timer isn't reset on every message update)
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  useEffect(() => {
    if (activeView !== 'chat' || !currentUser?.id) return;
    const timer = setTimeout(() => {
      const messages = chatMessagesRef.current;
      const ids = messages
        .filter(
          (m) =>
            m.senderId !== currentUser.id &&
            !getSeenByIds(m.seenBy).includes(currentUser.id)
        )
        .map((m) => m.id);
      if (ids.length) handleMarkMessagesAsSeen(ids);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeView, currentUser?.id, handleMarkMessagesAsSeen]);

  // Tasks with an active reminder (not completed) for header notification count and dropdown
  const reminderTasks = tasks.filter((t) => t.status !== 'completed' && t.reminder);
  const reminderCount = reminderTasks.length;

  const handleReminderClick = useCallback((task: Task) => {
    if (task.reminder) setActiveReminder({ task, reminder: task.reminder });
  }, []);

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
        return (
          <TeamList
            teamMembers={teamMembers}
            tasks={tasks}
            onAddMember={handleAddTeamMember}
            onUpdateMember={handleUpdateTeamMember}
            onDeleteMember={handleDeleteTeamMember}
          />
        );
      case 'chat':
        return (
          <TeamChat
            messages={chatMessages}
            teamMembers={teamMembers}
            onlineCount={onlineCount}
            onSendMessage={handleSendChatMessage}
            onEditMessage={handleUpdateChatMessage}
            onDeleteMessage={handleDeleteChatMessage}
            onToggleReaction={handleToggleReaction}
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
        unreadChatCount={unreadChatCount}
      />

      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'ml-0 lg:ml-64'
        )}
      >
        <Header
          {...viewConfig}
          onMenuClick={() => setMobileSidebarOpen(true)}
          reminderCount={reminderCount}
          reminderTasks={reminderTasks}
          onReminderClick={handleReminderClick}
        />
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

      <ReminderPopup
        open={!!activeReminder}
        task={activeReminder?.task ?? null}
        reminder={activeReminder?.reminder ?? null}
        onNotifyLater={handleReminderNotifyLater}
        onDontShowAgain={handleReminderDontShowAgain}
      />
    </div>
  );
}
