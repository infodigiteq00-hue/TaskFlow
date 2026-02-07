import { useState, useEffect } from 'react';
import { Task, TaskReminder, RemindInUnit, ReminderRepeat } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TaskReminderPopoverProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetReminder: (task: Task, reminder: TaskReminder) => void;
  onClearReminder: (task: Task) => void;
  triggerClassName?: string;
  /** Unique id for the sound checkbox (avoid duplicate ids when multiple sheets open) */
  checkboxId?: string;
}

function getRemindInMinutes(value: string, unit: RemindInUnit): number {
  const v = Math.max(0, Math.floor(Number(value) || 0));
  if (unit === 'minutes') return v;
  if (unit === 'hours') return v * 60;
  return v * 24 * 60;
}

export function TaskReminderPopover({
  task,
  open,
  onOpenChange,
  onSetReminder,
  onClearReminder,
  triggerClassName,
  checkboxId = 'remind-sound',
}: TaskReminderPopoverProps) {
  const [remindValue, setRemindValue] = useState('30');
  const [remindUnit, setRemindUnit] = useState<RemindInUnit>('minutes');
  const [remindRepeat, setRemindRepeat] = useState<ReminderRepeat>('none');
  const [remindSound, setRemindSound] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (task.reminder) {
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
  }, [open, task.id, task.reminder]);

  const handleSet = () => {
    const remindInMinutes = getRemindInMinutes(remindValue, remindUnit);
    if (remindInMinutes <= 0) return;
    const reminder: TaskReminder = {
      remindInMinutes,
      repeat: remindRepeat,
      sound: remindSound,
      setAt: new Date().toISOString(),
    };
    onSetReminder(task, reminder);
    onOpenChange(false);
  };

  const handleClear = () => {
    onClearReminder(task);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 gap-1.5 text-xs', task.reminder && 'text-blue-600 dark:text-blue-400', triggerClassName)}
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
              id={checkboxId}
              checked={remindSound}
              onCheckedChange={(c) => setRemindSound(!!c)}
            />
            <label htmlFor={checkboxId} className="text-sm cursor-pointer">
              Notify with sound
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={handleSet}>
              Set reminder
            </Button>
            {task.reminder && (
              <Button type="button" variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
