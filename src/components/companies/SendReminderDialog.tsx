import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Company, Task } from '@/types/task';
import { Mail, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface SendReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  companyTasks: Task[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

function buildReminderBody(company: Company, activeTasks: Task[]): string {
  const lines = [
    'Reminder from TaskFlow',
    '',
    `Company: ${company.name}`,
    '',
  ];
  if (activeTasks.length > 0) {
    lines.push('Active tasks:');
    activeTasks.forEach((t) => {
      lines.push(`- ${t.title} (Due: ${formatDate(t.endDate)})`);
    });
    lines.push('');
  }
  lines.push('Please review and update status when possible.');
  return lines.join('\r\n');
}

function buildSubject(company: Company): string {
  return `TaskFlow: Reminder for ${company.name}`;
}

export function SendReminderDialog({
  open,
  onOpenChange,
  company,
  companyTasks,
}: SendReminderDialogProps) {
  const [copied, setCopied] = useState(false);
  const activeTasks = companyTasks.filter((t) => t.status !== 'completed');
  const hasEmail = Boolean(company?.contactEmail?.trim());

  const handleSendReminder = () => {
    if (!company) return;
    const subject = encodeURIComponent(buildSubject(company));
    const body = encodeURIComponent(buildReminderBody(company, activeTasks));
    if (hasEmail) {
      const mailto = `mailto:${company.contactEmail}?subject=${subject}&body=${body}`;
      window.open(mailto, '_blank', 'noopener,noreferrer');
      onOpenChange(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!company) return;
    const text = `Subject: ${buildSubject(company)}\n\n${buildReminderBody(company, activeTasks)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">{company.name}</p>
            {hasEmail ? (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{company.contactEmail}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No contact email set for this company.</p>
            )}
          </div>

          {activeTasks.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Active tasks ({activeTasks.length})
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto rounded-md border border-border p-3 bg-muted/30">
                {activeTasks.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="truncate">{t.title}</span>
                    <span className="shrink-0">{formatDate(t.endDate)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active tasks for this company.</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {hasEmail ? (
              <Button
                variant="accent"
                className="gap-2"
                onClick={handleSendReminder}
              >
                <Mail className="w-4 h-4" />
                Open email to send reminder
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyMessage}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied' : 'Copy message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
