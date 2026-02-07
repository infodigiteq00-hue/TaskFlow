import { useState } from 'react';
import { Task, TeamMember, TASK_STAGE_OPTIONS } from '@/types/task';
import { getAssignedNames, getDueCountdown } from '@/lib/taskUtils';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, Pencil, Building2, Upload } from 'lucide-react';
import { TaskReminderPopover } from './TaskReminderPopover';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onUpdateTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  teamMembers,
  onUpdateTask,
  onEditTask,
}: TaskDetailSheetProps) {
  const [reminderOpen, setReminderOpen] = useState(false);

  const handleToggleComplete = (t: Task) => {
    const newStatus = t.status === 'completed' ? 'pending' : 'completed';
    onUpdateTask({
      ...t,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUploadClick = (t: Task) => {
    const url = prompt('Document URL (or leave empty to clear):', t.finalFileUrl || '');
    if (url !== null) {
      const now = new Date().toISOString();
      onUpdateTask({
        ...t,
        finalFileUrl: url || undefined,
        docUploadedAt: url ? now : undefined,
        updatedAt: now,
      });
    }
  };

  const handleStageChange = (t: Task, stage: string) => {
    onUpdateTask({
      ...t,
      stage: stage || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleEdit = (t: Task) => {
    onEditTask?.(t);
    onOpenChange(false);
  };

  if (!task) return null;

  const isComplete = task.status === 'completed';
  const due = getDueCountdown(task.endDate, task.endTime);
  const assignedNames = getAssignedNames(task.assignedTo, teamMembers);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold pr-8">Task details</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-3">
            <Checkbox
              checked={isComplete}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-0.5 shrink-0"
              aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
            />
            <div className="flex-1 min-w-0 space-y-3">
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {task.companyName}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  {assignedNames}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                  <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-6">{task.description}</span>
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
                    <SelectTrigger className="h-8 w-[180px] text-xs">
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
                  open={reminderOpen}
                  onOpenChange={setReminderOpen}
                  onSetReminder={(t, reminder) => {
                    onUpdateTask({ ...t, reminder, updatedAt: new Date().toISOString() });
                    setReminderOpen(false);
                  }}
                  onClearReminder={(t) => {
                    onUpdateTask({ ...t, reminder: undefined, updatedAt: new Date().toISOString() });
                    setReminderOpen(false);
                  }}
                  checkboxId="remind-sound-detail"
                />
                {onEditTask && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleEdit(task)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleUploadClick(task)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {task.finalFileUrl ? 'View / change doc' : 'Upload doc'}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
