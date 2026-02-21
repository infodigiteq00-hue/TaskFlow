import { useEffect, useRef } from 'react';
import { Task, TaskReminder } from '@/types/task';
import {
  reminderScheduleId,
  scheduleReminder,
  cancelReminder,
} from '@/lib/reminderStorage';

const REPEAT_MINUTES: Record<TaskReminder['repeat'], number> = {
  none: 0,
  hour: 60,
  day: 24 * 60,
};

function logReminder(
  label: string,
  task: Task,
  reminder: TaskReminder,
  extra?: { firstFireAt?: number; delayMs?: number; now?: number }
) {
  const t = new Date();
  const fireAtStr = extra?.firstFireAt
    ? new Date(extra.firstFireAt).toLocaleString()
    : null;
  console.log(
    `[Reminder] ${label}`,
    {
      task: task.title,
      remindInMinutes: reminder.remindInMinutes,
      repeat: reminder.repeat,
      setAt: reminder.setAt,
      now: new Date(extra?.now ?? Date.now()).toLocaleString(),
      ...(fireAtStr != null && { willFireAt: fireAtStr }),
      ...(extra?.delayMs != null && { delayMs: extra.delayMs, delaySec: Math.round(extra.delayMs / 1000) }),
    },
    `(${t.toLocaleTimeString()})`
  );
}

function playReminderSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore
  }
}

export type OnReminderFire = (task: Task, reminder: TaskReminder) => void;

function fireReminder(
  task: Task,
  reminder: TaskReminder,
  onReminderFire?: OnReminderFire
) {
  console.log(
    `[Reminder] FIRED (popup + sound) — "${task.title}" at ${new Date().toLocaleString()}`
  );
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const title = `Reminder: ${task.title}`;
  const body = task.companyName ? `${task.companyName}` : 'Task reminder';
  try {
    new Notification(title, { body });
  } catch {
    // ignore
  }
  if (reminder.sound) playReminderSound();
  onReminderFire?.(task, reminder);
}

export function useReminderScheduler(tasks: Task[], onReminderFire?: OnReminderFire) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  // Ids we sent to SW/IndexedDB so we can cancel them on cleanup
  const scheduledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission().catch(() => {});
  }, []);

  useEffect(() => {
    const clearAll = () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      intervalsRef.current.forEach((i) => clearInterval(i));
      intervalsRef.current = [];
      scheduledIdsRef.current.forEach((id) => cancelReminder(id));
      scheduledIdsRef.current.clear();
    };

    const schedule = (task: Task, reminder: TaskReminder) => {
      const setAt = new Date(reminder.setAt).getTime();
      const firstFireAt = setAt + reminder.remindInMinutes * 60 * 1000;
      const now = Date.now();
      const repeatMs = REPEAT_MINUTES[reminder.repeat] * 60 * 1000;

      const fire = () => {
        fireReminder(task, reminder, onReminderFire);
        if (reminder.repeat !== 'none' && repeatMs > 0) {
          const id = setInterval(
            () => fireReminder(task, reminder, onReminderFire),
            repeatMs
          );
          intervalsRef.current.push(id);
        }
      };

      if (firstFireAt <= now) {
        logReminder('SCHEDULED (fires immediately, already past time)', task, reminder, {
          firstFireAt,
          now,
        });
        fire();
        return;
      }
      const delay = firstFireAt - now;
      logReminder('SCHEDULED (timer set)', task, reminder, {
        firstFireAt,
        delayMs: delay,
        now,
      });
      const id = setTimeout(fire, delay);
      timersRef.current.push(id);
      // Persist and send to service worker so notification can show when tab is background/closed
      const scheduleId = reminderScheduleId(task.id, reminder.setAt);
      scheduledIdsRef.current.add(scheduleId);
      const title = `Reminder: ${task.title}`;
      const body = task.companyName ? task.companyName : 'Task reminder';
      scheduleReminder({
        id: scheduleId,
        fireAt: firstFireAt,
        title,
        body,
        task,
        reminder,
      });
    };

    const withReminder = tasks.filter(
      (t) => t.status !== 'completed' && t.reminder
    );
    console.log(
      `[Reminder] Scheduler run: ${tasks.length} tasks, ${withReminder.length} with active reminders. Now = ${new Date().toLocaleString()}`
    );
    withReminder.forEach((task) => schedule(task, task.reminder!));

    return clearAll;
  }, [tasks]);
}
