export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'urgent';

export type TaskCategory = 
  | 'linkedin-management'
  | 'company-profile'
  | 'website'
  | 'presentation'
  | 'corporate-video'
  | 'visiting-card'
  | 'banner'
  | 'other';

export type CategoryOption = { value: string; label: string };

export type RemindInUnit = 'minutes' | 'hours' | 'days';
export type ReminderRepeat = 'none' | 'hour' | 'day';

export interface TaskReminder {
  /** Remind in this many minutes (computed from value × unit) */
  remindInMinutes: number;
  repeat: ReminderRepeat;
  sound: boolean;
  /** ISO string when reminder was set */
  setAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** TaskCategory for built-in, or custom category value string */
  category: TaskCategory | string;
  status: TaskStatus;
  companyId: string;
  companyName: string;
  assignedTo: string[];
  assignedBy: string;
  startDate: string;
  endDate: string;
  /** Optional finish time (HH:mm) – used for "in X hours" countdown for team */
  endTime?: string;
  finalFileUrl?: string;
  /** When the doc was uploaded (ISO date string) – for tracker */
  docUploadedAt?: string;
  /** Published LinkedIn post URL – for tracking regularity per client */
  linkedInPostUrl?: string;
  /** When the post was published on LinkedIn (ISO date string) */
  linkedInPostedOn?: string;
  /** Who posted it (display name) */
  linkedInPostedBy?: string;
  priority: 'low' | 'medium' | 'high';
  /** If true, task appears in the Core tasks section on the dashboard */
  isCoreTask?: boolean;
  /** Workflow stage / tag: e.g. Ongoing, Content pending, Sent for review, or custom */
  stage?: string;
  /** Special notes (e.g. for LinkedIn post form) */
  specialNotes?: string;
  reminder?: TaskReminder;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  contactEmail?: string;
  linkedInSubscription: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  taskId?: string;
}

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'linkedin-management', label: 'LinkedIn Management', icon: '💼' },
  { value: 'company-profile', label: 'Company Profile', icon: '🏢' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'presentation', label: 'Presentation', icon: '📊' },
  { value: 'corporate-video', label: 'Corporate Video', icon: '🎬' },
  { value: 'visiting-card', label: 'Visiting Card', icon: '🪪' },
  { value: 'banner', label: 'Banner', icon: '🖼️' },
  { value: 'other', label: 'Other', icon: '📁' },
];

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'urgent', label: 'Urgent' },
];

/** Predefined workflow stages for "Mark task" dropdown */
export const TASK_STAGE_OPTIONS = [
  'Ongoing',
  'Content pending',
  'Sent for review',
  'Design pending',
  'Editing required',
  'Ready for delivery',
] as const;

const TASK_STAGE_CUSTOM_KEY = 'task-stage-custom';

export function getCustomTaskStages(): string[] {
  try {
    const raw = localStorage.getItem(TASK_STAGE_CUSTOM_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addCustomTaskStage(stage: string): void {
  const trimmed = stage.trim();
  if (!trimmed) return;
  const list = getCustomTaskStages();
  if (list.includes(trimmed)) return;
  list.push(trimmed);
  try {
    localStorage.setItem(TASK_STAGE_CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
