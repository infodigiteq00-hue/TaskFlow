import { useState } from 'react';
import { Task, TeamMember, TaskReminder, RemindInUnit, ReminderRepeat, TASK_STAGE_OPTIONS } from '@/types/task';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, Pencil, Building2, Bell, Upload } from 'lucide-react';

function getAssignedNames(assignedTo: string[], teamMembers: TeamMember[]): string {
  if (!assignedTo.length) return 'Unassigned';
  const names = assignedTo
    .map((id) => teamMembers.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];
  return names.length ? names.join(', ') : 'Unassigned';
}

function getDueCountdown(endDate: string, endTime?: string): { text: string; overdue: boolean } {
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
  if (diffDays === 0) return { text: endTime ? 'Due today' : 'Due today', overdue: false };
  if (diffDays === 1) return { text: '1 day left', overdue: false };
  return { text: `${diffDays} days left`, overdue: false };
}

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
  const [remindValue, setRemindValue] = useState('30');
  const [remindUnit, setRemindUnit] = useState<RemindInUnit>('minutes');
  const [remindRepeat, setRemindRepeat] = useState<ReminderRepeat>('none');
  const [remindSound, setRemindSound] = useState(true);
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

  const openReminderPopover = () => {
    if (task?.reminder) {
      const r = task.reminder;
      if (r.remindInMinutes < 60) {
        setRemindValue(String(r.remindInMinutes));
        setRemindUnit('minutes');
      } else if (r.remindInMinutes < 24 * 60) {
        setRemindValue(String(Math.round(r.remindInMinutes / 60)));
        setRemindUnit('hours');
      } else {
        setRemindValue(String(Math.round(r.remindInMinutes / (24 * 60))));
        setRemindUnit('days');
      }
      setRemindRepeat(r.repeat);
      setRemindSound(r.sound);
    } else {
      setRemindValue('30');
      setRemindUnit('minutes');
      setRemindRepeat('none');
      setRemindSound(true);
    }
    setReminderOpen(true);
  };

  const getRemindInMinutes = (): number => {
    const v = Math.max(0, Math.floor(Number(remindValue) || 0));
    if (remindUnit === 'minutes') return v;
    if (remindUnit === 'hours') return v * 60;
    return v * 24 * 60;
  };

  const handleSetReminder = (t: Task) => {
    const remindInMinutes = getRemindInMinutes();
    if (remindInMinutes <= 0) return;
    const reminder: TaskReminder = {
      remindInMinutes,
      repeat: remindRepeat,
      sound: remindSound,
      setAt: new Date().toISOString(),
    };
    onUpdateTask({ ...t, reminder, updatedAt: new Date().toISOString() });
    setReminderOpen(false);
  };

  const handleClearReminder = (t: Task) => {
    onUpdateTask({ ...t, reminder: undefined, updatedAt: new Date().toISOString() });
    setReminderOpen(false);
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
                <Popover open={reminderOpen} onOpenChange={setReminderOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 gap-1.5 text-xs',
                        task.reminder && 'text-blue-600 dark:text-blue-400'
                      )}
                      onClick={openReminderPopover}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Reminder
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm">Set reminder</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Remind me in</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={remindValue}
                          onChange={(e) => setRemindValue(e.target.value)}
                          className="w-20"
                        />
                        <Select value={remindUnit} onValueChange={(v: RemindInUnit) => setRemindUnit(v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Repeat</Label>
                        <Select value={remindRepeat} onValueChange={(v: ReminderRepeat) => setRemindRepeat(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Don&apos;t repeat</SelectItem>
                            <SelectItem value="hour">Every hour</SelectItem>
                            <SelectItem value="day">Every day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remind-sound-detail"
                          checked={remindSound}
                          onCheckedChange={(c) => setRemindSound(!!c)}
                        />
                        <label htmlFor="remind-sound-detail" className="text-sm cursor-pointer">
                          Notify with sound
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSetReminder(task)}
                        >
                          Set reminder
                        </Button>
                        {task.reminder && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearReminder(task)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
