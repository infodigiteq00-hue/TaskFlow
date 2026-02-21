import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, TaskReminder } from '@/types/task';
import { Bell } from 'lucide-react';

export interface ReminderPopupProps {
  open: boolean;
  task: Task | null;
  reminder: TaskReminder | null;
  onNotifyLater: () => void;
  onDontShowAgain: () => void;
}

export function ReminderPopup({
  open,
  task,
  reminder,
  onNotifyLater,
  onDontShowAgain,
}: ReminderPopupProps) {
  if (!task || !reminder) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Reminder
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{task.title}</span>
              {task.companyName ? (
                <>
                  <br />
                  <span>{task.companyName}</span>
                </>
              ) : null}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onNotifyLater}>
            Notify me later
          </Button>
          <Button variant="secondary" onClick={onDontShowAgain}>
            Don&apos;t show again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
