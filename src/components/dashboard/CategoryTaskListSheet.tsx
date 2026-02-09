import { useState, useEffect, useRef } from 'react';
import { Task, TeamMember, TASK_STAGE_OPTIONS } from '@/types/task';
import { getCustomTaskStages, addCustomTaskStage } from '@/lib/taskStageStorage';
import { getAssignedNames, getDueCountdown, formatDisplayDate, sortTasksByPriorityAndStatus } from '@/lib/taskUtils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { uploadTaskFile } from '@/lib/storage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, User, Plus, Pencil, Building2, Search } from 'lucide-react';
import { TaskReminderPopover } from './TaskReminderPopover';

interface CategoryTaskListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: { value: string; label: string } | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  onUpdateTask: (task: Task) => void;
  onNewTask?: (categoryValue: string) => void;
  onEditTask?: (task: Task) => void;
}

export function CategoryTaskListSheet({
  open,
  onOpenChange,
  category,
  tasks,
  teamMembers,
  onUpdateTask,
  onNewTask,
  onEditTask,
}: CategoryTaskListSheetProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [taskForUpload, setTaskForUpload] = useState<Task | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryTasks = category
    ? sortTasksByPriorityAndStatus(tasks.filter((t) => t.category === category.value))
    : [];
  const today = formatDisplayDate(new Date().toISOString().slice(0, 10));

  const matchesCategorySearch = (task: Task, q: string): boolean => {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    const assignedNames = getAssignedNames(task.assignedTo, teamMembers).toLowerCase();
    return (
      task.title.toLowerCase().includes(lower) ||
      (task.description?.toLowerCase().includes(lower) ?? false) ||
      task.companyName.toLowerCase().includes(lower) ||
      assignedNames.includes(lower)
    );
  };
  const filteredCategoryTasks = categoryTasks.filter((t) => matchesCategorySearch(t, categorySearchQuery));

  useEffect(() => {
    if (!open) setCategorySearchQuery('');
  }, [open]);
  useEffect(() => {
    setCategorySearchQuery('');
  }, [category?.value]);

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdateTask({
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUploadClick = (task: Task) => {
    if (!user) return;
    setTaskForUpload(task);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const task = taskForUpload;
    e.target.value = '';
    setTaskForUpload(null);
    if (!file || !task || !user) return;
    setUploadingTaskId(task.id);
    try {
      const url = await uploadTaskFile(user.id, file, task.id);
      const now = new Date().toISOString();
      onUpdateTask({
        ...task,
        finalFileUrl: url,
        docUploadedAt: now,
        updatedAt: now,
      });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const [reminderPopoverTaskId, setReminderPopoverTaskId] = useState<string | null>(null);

  const handleStageChange = (task: Task, stage: string) => {
    onUpdateTask({
      ...task,
      stage: stage || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md h-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 pr-12 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl font-bold">
                {category?.label ?? 'Tasks'}
              </SheetTitle>
              <SheetDescription>
                {today}
              </SheetDescription>
            </div>
            {category && onNewTask && (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => onNewTask(category.value)}
              >
                <Plus className="h-4 w-4" />
                New task
              </Button>
            )}
          </div>
        </SheetHeader>

        {category && categoryTasks.length > 0 && (
          <div className="px-6 pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search in this category..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search tasks in category"
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          {categoryTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks in this category yet.
            </p>
          ) : filteredCategoryTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks match your search.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredCategoryTasks.map((task) => {
                const due = getDueCountdown(task.endDate, task.endTime, { formatTimeForToday: true });
                const assignedNames = getAssignedNames(task.assignedTo, teamMembers);
                const isComplete = task.status === 'completed';

                return (
                  <li
                    key={task.id}
                    className={cn(
                      'rounded-xl border bg-card p-4 shadow-sm transition-colors',
                      isComplete && 'opacity-75'
                    )}
                  >
                    <div className="flex gap-3">
                      <Checkbox
                        checked={isComplete}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="mt-0.5 shrink-0"
                        aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              'font-medium text-foreground flex-1 min-w-0',
                              isComplete && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </h3>
                          <span
                            className={cn(
                              'shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded',
                              task.priority === 'high' && 'bg-destructive/10 text-destructive',
                              task.priority === 'medium' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                              task.priority === 'low' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]" title={task.companyName}>
                              {task.companyName}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            {assignedNames}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="line-clamp-3">{task.description}</span>
                          </p>
                        )}
                        <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                            Time to deadline
                          </p>
                          <p
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              due.overdue ? 'text-destructive' : 'text-primary'
                            )}
                          >
                            {due.text}
                          </p>
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-xs text-muted-foreground shrink-0">Mark task</Label>
                            <Select
                              value={task.stage ?? ''}
                              onValueChange={(v) => handleStageChange(task, v)}
                            >
                              <SelectTrigger className="h-8 w-[160px] text-xs">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_STAGE_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <TaskReminderPopover
                            task={task}
                            open={reminderPopoverTaskId === task.id}
                            onOpenChange={(open) => {
                              if (open) setReminderPopoverTaskId(task.id);
                              else setReminderPopoverTaskId(null);
                            }}
                            onSetReminder={(t, reminder) => {
                              onUpdateTask({ ...t, reminder, updatedAt: new Date().toISOString() });
                              setReminderPopoverTaskId(null);
                            }}
                            onClearReminder={(t) => {
                              onUpdateTask({ ...t, reminder: undefined, updatedAt: new Date().toISOString() });
                              setReminderPopoverTaskId(null);
                            }}
                            checkboxId={`remind-sound-cat-${task.id}`}
                          />
                          {onEditTask && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => {
                                onEditTask(task);
                                onOpenChange(false);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept="image/*,application/pdf,video/*,.doc,.docx"
                            onChange={handleFileChange}
                            aria-hidden
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            disabled={!user || uploadingTaskId === task.id}
                            onClick={() => handleUploadClick(task)}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {uploadingTaskId === task.id ? 'Uploading…' : task.finalFileUrl ? 'View / change doc' : 'Upload doc'}
                          </Button>
                        </div>
                        {task.finalFileUrl && (
                          <a
                            href={task.finalFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary hover:underline truncate mt-1"
                            title={task.finalFileUrl}
                          >
                            {task.finalFileUrl.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        </div>
                      </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
