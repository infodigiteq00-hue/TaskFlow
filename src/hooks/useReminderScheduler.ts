import { useEffect, useRef } from 'react';
import { Task, TaskReminder } from '@/types/task';

const REPEAT_MINUTES: Record<TaskReminder['repeat'], number> = {
  none: 0,
  hour: 60,
  day: 24 * 60,
};

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

function fireReminder(task: Task, reminder: TaskReminder) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  const title = `Reminder: ${task.title}`;
  const body = task.companyName ? `${task.companyName}` : 'Task reminder';
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch {
    // ignore
  }
  if (reminder.sound) playReminderSound();
}

export function useReminderScheduler(tasks: Task[]) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

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
    };

    const schedule = (task: Task, reminder: TaskReminder) => {
      const setAt = new Date(reminder.setAt).getTime();
      const firstFireAt = setAt + reminder.remindInMinutes * 60 * 1000;
      const now = Date.now();
      const repeatMs = REPEAT_MINUTES[reminder.repeat] * 60 * 1000;

      const fire = () => {
        fireReminder(task, reminder);
        if (reminder.repeat !== 'none' && repeatMs > 0) {
          const id = setInterval(() => fireReminder(task, reminder), repeatMs);
          intervalsRef.current.push(id);
        }
      };

      if (firstFireAt <= now) {
        fire();
        return;
      }
      const delay = firstFireAt - now;
      const id = setTimeout(fire, delay);
      timersRef.current.push(id);
    };

    tasks.forEach((task) => {
      if (task.status === 'completed' || !task.reminder) return;
      schedule(task, task.reminder);
    });

    return clearAll;
  }, [tasks]);
}
