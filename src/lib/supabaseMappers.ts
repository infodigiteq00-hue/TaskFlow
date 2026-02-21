import type { Task, Company, TeamMember, ChatMessage, CategoryOption } from '@/types/task';

type DbCompany = {
  id: string;
  user_id: string;
  name: string;
  logo: string | null;
  contact_email: string | null;
  linkedin_subscription: boolean;
  created_at: string;
};

type DbTeamMember = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  department: string;
};

type DbCustomCategory = {
  id: string;
  user_id: string;
  value: string;
  label: string;
};

type DbTask = {
  id: string;
  user_id: string;
  company_id: string | null;
  company_name: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string[];
  assigned_by: string;
  start_date: string;
  end_date: string;
  end_time: string | null;
  final_file_url: string | null;
  doc_uploaded_at: string | null;
  linkedin_post_url: string | null;
  linkedin_posted_on: string | null;
  linkedin_posted_by: string | null;
  is_core_task: boolean | null;
  stage: string | null;
  special_notes: string | null;
  reminder: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type DbChatMessage = {
  id: string;
  user_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  message: string;
  timestamp: string;
  task_id: string | null;
  reactions?: Record<string, string[]> | null;
  seen_by?: string[] | Array<{ user_id: string; user_name?: string } | { id: string; name?: string }> | null;
};

export function mapCompany(r: DbCompany): Company {
  return {
    id: r.id,
    name: r.name,
    logo: r.logo ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    linkedInSubscription: r.linkedin_subscription,
    createdAt: r.created_at,
  };
}

export function mapTeamMember(r: DbTeamMember): TeamMember {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    avatar: r.avatar ?? undefined,
    role: r.role,
    department: r.department,
  };
}

export function mapCustomCategory(r: DbCustomCategory): CategoryOption {
  return { value: r.value, label: r.label };
}

export function mapTask(r: DbTask): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status as Task['status'],
    companyId: r.company_id ?? '',
    companyName: r.company_name ?? '',
    assignedTo: r.assigned_to ?? [],
    assignedBy: r.assigned_by,
    startDate: r.start_date,
    endDate: r.end_date,
    endTime: r.end_time ?? undefined,
    finalFileUrl: r.final_file_url ?? undefined,
    docUploadedAt: r.doc_uploaded_at ?? undefined,
    linkedInPostUrl: r.linkedin_post_url ?? undefined,
    linkedInPostedOn: r.linkedin_posted_on ?? undefined,
    linkedInPostedBy: r.linkedin_posted_by ?? undefined,
    priority: (r.priority as Task['priority']) ?? 'medium',
    isCoreTask: r.is_core_task ?? undefined,
    stage: r.stage ?? undefined,
    specialNotes: r.special_notes ?? undefined,
    reminder: r.reminder as Task['reminder'] ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapChatMessage(r: DbChatMessage): ChatMessage {
  return {
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderAvatar: r.sender_avatar ?? undefined,
    message: r.message,
    timestamp: r.timestamp,
    taskId: r.task_id ?? undefined,
    reactions: r.reactions && typeof r.reactions === 'object' ? (r.reactions as Record<string, string[]>) : undefined,
    seenBy: Array.isArray(r.seen_by)
      ? r.seen_by.map((x) => {
          if (typeof x === 'string') return { userId: x, userName: undefined };
          const id = 'user_id' in x ? x.user_id : x.id;
          const name = 'user_name' in x ? x.user_name : x.name;
          return { userId: id, userName: name };
        })
      : undefined,
  };
}

/** Convert Task to DB row shape (snake_case) for insert/update */
export function taskToDb(t: Task): Record<string, unknown> {
  return {
    company_id: t.companyId || null,
    company_name: t.companyName || null,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    priority: t.priority,
    assigned_to: t.assignedTo ?? [],
    assigned_by: t.assignedBy ?? '',
    start_date: t.startDate,
    end_date: t.endDate,
    end_time: t.endTime ?? null,
    final_file_url: t.finalFileUrl ?? null,
    doc_uploaded_at: t.docUploadedAt ?? null,
    linkedin_post_url: t.linkedInPostUrl ?? null,
    linkedin_posted_on: t.linkedInPostedOn ?? null,
    linkedin_posted_by: t.linkedInPostedBy ?? null,
    is_core_task: t.isCoreTask ?? null,
    stage: t.stage ?? null,
    special_notes: t.specialNotes ?? null,
    reminder: t.reminder ?? null,
  };
}

/** Convert Company to DB row shape */
export function companyToDb(c: Company): Record<string, unknown> {
  return {
    name: c.name,
    logo: c.logo ?? null,
    contact_email: c.contactEmail ?? null,
    linkedin_subscription: c.linkedInSubscription,
  };
}

/** Convert TeamMember to DB row shape */
export function teamMemberToDb(m: TeamMember): Record<string, unknown> {
  return {
    name: m.name,
    email: m.email,
    avatar: m.avatar ?? null,
    role: m.role,
    department: m.department,
  };
}

/** Convert ChatMessage to DB row shape */
export function chatMessageToDb(msg: ChatMessage): Record<string, unknown> {
  return {
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_avatar: msg.senderAvatar ?? null,
    message: msg.message,
    timestamp: msg.timestamp,
    task_id: msg.taskId ?? null,
  };
}
