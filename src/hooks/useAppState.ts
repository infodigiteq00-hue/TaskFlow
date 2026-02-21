import { useState, useEffect, useCallback } from 'react';
import { Task, TASK_CATEGORIES, CategoryOption, Company, TeamMember, ChatMessage, getSeenByIds } from '@/types/task';
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
  const [onlineCount, setOnlineCount] = useState(0);

  const categories: CategoryOption[] = [...defaultCategories, ...customCategories];
  const customCategoryValues = new Set(customCategories.map((c) => c.value));

  const userId = user?.id ?? null;
  const userName = user?.user_metadata?.full_name ?? user?.email ?? 'User';

  const chatReadStorageKey = userId ? `taskflow_chat_read_${userId}` : '';
  const [lastReadChatAt, setLastReadChatAt] = useState<string>('0');

  useEffect(() => {
    if (!chatReadStorageKey) return;
    try {
      setLastReadChatAt(localStorage.getItem(chatReadStorageKey) ?? '0');
    } catch {
      setLastReadChatAt('0');
    }
  }, [chatReadStorageKey]);

  /** Mark chat as read (call when user opens Team Chat). Persists per user per device. */
  const markChatAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setLastReadChatAt(now);
    if (chatReadStorageKey) {
      try {
        localStorage.setItem(chatReadStorageKey, now);
      } catch {
        // ignore
      }
    }
  }, [chatReadStorageKey]);

  /** Unread = messages from others with timestamp > last read */
  const unreadChatCount = userId
    ? chatMessages.filter(
        (m) => m.senderId !== userId && new Date(m.timestamp) > new Date(lastReadChatAt)
      ).length
    : 0;

  /** Soft, distinct sound when a new chat message arrives (from another user) */
  const playNewMessageSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(523, 0, 0.08);
      playTone(659, 0.12, 0.08);
    } catch {
      // ignore
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const [companiesRes, teamRes, tasksRes, chatRes, categoriesRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*'),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
      supabase.from('custom_categories').select('*'),
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
    fetchAll()
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [userId, fetchAll]);

  // Presence: track who is online (in the app); count updates in real time when users log in/out or close tab
  useEffect(() => {
    if (!userId) {
      setOnlineCount(0);
      return;
    }
    const channel = supabase
      .channel('taskflow-online')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ user_id?: string }>>;
        const ids = new Set<string>();
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (p?.user_id) ids.add(p.user_id);
          }
        }
        setOnlineCount(ids.size);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, name: userName });
        }
      });
    return () => {
      supabase.removeChannel(channel);
      setOnlineCount(0);
    };
  }, [userId, userName]);

  // Real-time: INSERT = new message (append); UPDATE = edit/reactions (in place); DELETE = remove
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('chat_messages_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as Parameters<typeof mapChatMessage>[0];
          const mapped = mapChatMessage(row);
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === mapped.id)) return prev;
            return [...prev, mapped];
          });
          if (row.sender_id !== userId) playNewMessageSound();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as Parameters<typeof mapChatMessage>[0];
          const mapped = mapChatMessage(row);
          setChatMessages((prev) =>
            prev.map((m) => (m.id === mapped.id ? mapped : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.old as { id: string };
          if (row?.id)
            setChatMessages((prev) => prev.filter((m) => m.id !== row.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, playNewMessageSound]);

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

  const handleUpdateTeamMember = useCallback(
    async (member: TeamMember) => {
      if (!userId) return;
      const row = teamMemberToDb(member) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('team_members')
        .update(row)
        .eq('id', member.id)
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === member.id ? mapTeamMember(data) : m))
      );
    },
    [userId]
  );

  const handleDeleteTeamMember = useCallback(
    async (memberId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      if (error) {
        console.error(error);
        return;
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
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
        .eq('id', companyId);
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

  const handleUpdateChatMessage = useCallback(
    async (id: string, message: string) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ message, timestamp: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setChatMessages((prev) =>
        prev.map((m) => (m.id === id ? mapChatMessage(data) : m))
      );
    },
    [userId]
  );

  const handleDeleteChatMessage = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) {
      console.error(error);
      return;
    }
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
  }, [userId]);

  /** WhatsApp-style reactions: max 1 reaction per user per message. New emoji = replace old. Same emoji click = toggle off. */
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      const msg = chatMessages.find((m) => m.id === messageId);
      if (!msg) return;
      const current = msg.reactions ?? {};
      const usersForEmoji = current[emoji] ?? [];
      const hasReactedWithThis = usersForEmoji.includes(userId);

      let newReactions: Record<string, string[]>;
      if (hasReactedWithThis) {
        // Same emoji again: deselect (toggle remove)
        const next = usersForEmoji.filter((u) => u !== userId);
        newReactions = { ...current };
        if (next.length === 0) delete newReactions[emoji];
        else newReactions[emoji] = next;
      } else {
        // New emoji: remove user from any other emoji (replace), then add to this one
        newReactions = {};
        for (const [e, userIds] of Object.entries(current)) {
          const filtered = (userIds ?? []).filter((u) => u !== userId);
          if (filtered.length > 0) newReactions[e] = filtered;
        }
        const existing = newReactions[emoji] ?? [];
        newReactions[emoji] = [...existing, userId];
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId)
        .select('*')
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setChatMessages((prev) =>
        prev.map((m) => (m.id === messageId ? mapChatMessage(data) : m))
      );
    },
    [userId, chatMessages]
  );

  /** Mark messages as seen by the current user (call when user is viewing chat). Stores id + name so "Seen by" shows names. */
  const handleMarkMessagesAsSeen = useCallback(
    async (messageIds: string[]) => {
      if (!userId || !userName || messageIds.length === 0) return;
      const toUpdate = messageIds.filter((id) => {
        const m = chatMessages.find((msg) => msg.id === id);
        return m && m.senderId !== userId && !getSeenByIds(m.seenBy).includes(userId);
      });
      const toDb = (entry: { userId: string; userName?: string | null } | string) =>
        typeof entry === 'string'
          ? { user_id: entry, user_name: null }
          : { user_id: entry.userId, user_name: entry.userName ?? null };
      for (const id of toUpdate) {
        const m = chatMessages.find((msg) => msg.id === id);
        if (!m) continue;
        const existing = m.seenBy ?? [];
        const nextSeenBy = [
          ...existing.map((x) => (typeof x === 'string' ? { userId: x, userName: null } : { userId: x.userId, userName: x.userName ?? null })),
          { userId, userName },
        ].map(toDb);
        const { data, error } = await supabase
          .from('chat_messages')
          .update({ seen_by: nextSeenBy })
          .eq('id', id)
          .select('*')
          .single();
        if (!error && data)
          setChatMessages((prev) =>
            prev.map((msg) => (msg.id === id ? mapChatMessage(data) : msg))
          );
      }
    },
    [userId, userName, chatMessages]
  );

  return {
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
  };
}
