import { useState, useEffect, useCallback } from 'react';
import { Task, TASK_CATEGORIES, CategoryOption, Company, TeamMember, ChatMessage } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  mapCompany,
  mapTeamMember,
  mapTask,
  mapChatMessage,
  mapCustomCategory,
  taskToDb,
  companyToDb,
  teamMemberToDb,
  chatMessageToDb,
} from '@/lib/supabaseMappers';

const defaultCategories: CategoryOption[] = TASK_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

export function useAppState() {
  const { user } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryOption[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialCategoryForNewTask, setInitialCategoryForNewTask] = useState<string | null>(null);

  const categories: CategoryOption[] = [...defaultCategories, ...customCategories];
  const customCategoryValues = new Set(customCategories.map((c) => c.value));

  const userId = user?.id ?? null;

  const fetchAll = useCallback(async (uid: string) => {
    const [companiesRes, teamRes, tasksRes, chatRes, categoriesRes] = await Promise.all([
      supabase.from('companies').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').eq('user_id', uid),
      supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').eq('user_id', uid).order('timestamp', { ascending: true }),
      supabase.from('custom_categories').select('*').eq('user_id', uid),
    ]);

    if (companiesRes.error) throw companiesRes.error;
    if (teamRes.error) throw teamRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (chatRes.error) throw chatRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    setCompanies((companiesRes.data ?? []).map(mapCompany));
    setTeamMembers((teamRes.data ?? []).map(mapTeamMember));
    setTasks((tasksRes.data ?? []).map(mapTask));
    setChatMessages((chatRes.data ?? []).map(mapChatMessage));
    setCustomCategories((categoriesRes.data ?? []).map(mapCustomCategory));
  }, []);

  useEffect(() => {
    if (!userId) {
      setDataLoading(false);
      setTasks([]);
      setCompanies([]);
      setTeamMembers([]);
      setChatMessages([]);
      setCustomCategories([]);
      return;
    }
    setDataLoading(true);
    fetchAll(userId)
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [userId, fetchAll]);

  const handleAddCategory = useCallback(
    async (category: CategoryOption) => {
      if (!userId) return;
      const { error } = await supabase.from('custom_categories').insert({
        user_id: userId,
        value: category.value,
        label: category.label,
      });
      if (error) {
        console.error(error);
        return;
      }
      setCustomCategories((prev) => [...prev, category]);
    },
    [userId]
  );

  const handleEditCategory = useCallback(
    async (value: string, newLabel: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('custom_categories')
        .update({ label: newLabel })
        .eq('user_id', userId)
        .eq('value', value);
      if (error) {
        console.error(error);
        return;
      }
      setCustomCategories((prev) =>
        prev.map((c) => (c.value === value ? { ...c, label: newLabel } : c))
      );
    },
    [userId]
  );

  const handleDeleteCategory = useCallback(
    async (value: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('user_id', userId)
        .eq('value', value);
      if (error) {
        console.error(error);
        return;
      }
      setCustomCategories((prev) => prev.filter((c) => c.value !== value));
    },
    [userId]
  );

  const handleOpenNewTask = useCallback((categoryValue?: string) => {
    setInitialCategoryForNewTask(categoryValue ?? null);
    setEditingTask(null);
    setIsNewTaskOpen(true);
  }, []);

  const handleCloseTaskDialog = useCallback((open: boolean) => {
    if (!open) {
      setIsNewTaskOpen(false);
      setEditingTask(null);
      setInitialCategoryForNewTask(null);
    }
  }, []);

  const handleAddCompany = useCallback(
    async (company: Company) => {
      if (!userId) return;
      const row = companyToDb(company) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('companies')
        .insert({ user_id: userId, ...row })
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setCompanies((prev) => [mapCompany(data), ...prev]);
    },
    [userId]
  );

  const handleAddTeamMember = useCallback(
    async (member: TeamMember) => {
      if (!userId) return;
      const row = teamMemberToDb(member) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('team_members')
        .insert({ user_id: userId, ...row })
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setTeamMembers((prev) => [...prev, mapTeamMember(data)]);
    },
    [userId]
  );

  const handleUpdateCompany = useCallback(
    async (company: Company) => {
      if (!userId) return;
      const row = companyToDb(company) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('companies')
        .update(row)
        .eq('id', company.id)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? mapCompany(data) : c))
      );
    },
    [userId]
  );

  const handleDeleteCompany = useCallback(
    async (companyId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
        .eq('user_id', userId);
      if (error) {
        console.error(error);
        return;
      }
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    },
    [userId]
  );

  const handleNewTask = useCallback(
    async (taskData: Task) => {
      if (!userId) return;
      const row = taskToDb(taskData) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: userId, ...row })
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setTasks((prev) => [mapTask(data), ...prev]);
    },
    [userId]
  );

  const handleUpdateTask = useCallback(
    async (task: Task) => {
      if (!userId) return;
      const row = taskToDb(task) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('tasks')
        .update(row)
        .eq('id', task.id)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? mapTask(data) : t))
      );
    },
    [userId]
  );

  const handleTaskClick = useCallback((task: Task) => {
    console.log('Task clicked:', task);
  }, []);

  const handleSendChatMessage = useCallback(
    async (message: ChatMessage) => {
      if (!userId) return;
      const row = chatMessageToDb(message) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user_id: userId, ...row })
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setChatMessages((prev) => [...prev, mapChatMessage(data)]);
    },
    [userId]
  );

  return {
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
  };
}
