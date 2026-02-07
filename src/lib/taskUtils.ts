import type { Task, TeamMember } from '@/types/task';

export type GetAssignedNamesFormat = 'display' | 'search';

/**
 * Returns assignee names for display ("Name1, Name2") or search (space-joined lowercase).
 */
export function getAssignedNames(
  assignedTo: string[],
  teamMembers: TeamMember[],
  format: GetAssignedNamesFormat = 'display'
): string {
  if (!assignedTo.length) return format === 'display' ? 'Unassigned' : '';
  const names = assignedTo
    .map((id) => teamMembers.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];
  if (!names.length) return format === 'display' ? 'Unassigned' : '';
  if (format === 'search') return names.join(' ').toLowerCase();
  return names.join(', ');
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

export interface GetDueCountdownOptions {
  /** When true and due today with endTime, show "Due today at 2:30 PM" */
  formatTimeForToday?: boolean;
}

export function getDueCountdown(
  endDate: string,
  endTime?: string,
  options: GetDueCountdownOptions = {}
): { text: string; overdue: boolean } {
  const { formatTimeForToday = false } = options;
  const end = new Date(endDate);
  if (endTime) {
    const [h, m] = endTime.split(':').map(Number);
    end.setHours(h ?? 0, m ?? 0, 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
  }
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffMins = Math.ceil(diffMs / (1000 * 60));
  if (diffMs < 0) {
    const absHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const absMins = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));
    if (endTime && Math.abs(diffMs) < 24 * 60 * 60 * 1000)
      return { text: `${absHours}h ${absMins}m overdue`, overdue: true };
    return { text: `${Math.abs(diffDays)} day(s) overdue`, overdue: true };
  }
  if (diffMins < 60 && endTime)
    return { text: `${diffMins} min left`, overdue: false };
  if (diffHours < 24 && (endTime || diffHours > 0))
    return { text: `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`, overdue: false };
  if (diffDays === 0) {
    const text =
      formatTimeForToday && endTime
        ? `Due today at ${formatTime(endTime)}`
        : 'Due today';
    return { text, overdue: false };
  }
  if (diffDays === 1) return { text: '1 day left', overdue: false };
  return { text: `${diffDays} days left`, overdue: false };
}

const ACTIVE_STATUSES = ['in-progress', 'urgent'] as const;

export function getDueBreakdown(
  tasks: Task[]
): { taskActive: number; overdue: number; upcoming: number } {
  const todayStr = new Date().toISOString().slice(0, 10);
  const notCompleted = tasks.filter((t) => t.status !== 'completed');
  let taskActive = 0;
  let overdue = 0;
  let upcoming = 0;
  for (const t of notCompleted) {
    if (ACTIVE_STATUSES.includes(t.status as (typeof ACTIVE_STATUSES)[number])) taskActive += 1;
    const d = (t.endDate || '').slice(0, 10);
    if (d < todayStr) overdue += 1;
    else if (d >= todayStr) upcoming += 1;
  }
  return { taskActive, overdue, upcoming };
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const STATUS_ORDER = { urgent: 0, 'in-progress': 1, pending: 2, completed: 3 } as const;

export function sortTasksByPriorityAndStatus(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return (
      (STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] ?? 4) -
      (STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] ?? 4)
    );
  });
}
