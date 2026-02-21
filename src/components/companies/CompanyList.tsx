import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Mail, Linkedin, Plus, MoreHorizontal, Bell } from 'lucide-react';
import { Company, Task } from '@/types/task';
import { SendReminderDialog } from './SendReminderDialog';

interface CompanyListProps {
  companies: Company[];
  tasks: Task[];
}

export function CompanyList({ companies, tasks }: CompanyListProps) {
  const [reminderCompany, setReminderCompany] = useState<Company | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Companies</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your client companies</p>
        </div>
        <Button variant="accent" className="gap-1.5 sm:gap-2 text-sm sm:text-base shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 shrink-0" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {companies.map((company) => {
          const companyTasks = tasks.filter(t => t.companyId === company.id);
          const activeTasks = companyTasks.filter(t => t.status !== 'completed').length;
          const completedTasks = companyTasks.filter(t => t.status === 'completed').length;

          return (
            <Card key={company.id} className="p-4 sm:p-5 hover-lift cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{company.name}</h3>
                    {company.linkedInSubscription && (
                      <Badge variant="info" className="mt-1 gap-1">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn Active
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setReminderCompany(company);
                      }}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Send reminder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {company.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail className="w-4 h-4" />
                  {company.contactEmail}
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{activeTasks}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Active</p>
                </div>
                <div className="w-px h-6 sm:h-8 bg-border shrink-0" />
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-success">{completedTasks}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="w-px h-6 sm:h-8 bg-border shrink-0" />
                <div className="text-center flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{companyTasks.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <SendReminderDialog
        open={Boolean(reminderCompany)}
        onOpenChange={(open) => !open && setReminderCompany(null)}
        company={reminderCompany}
        companyTasks={reminderCompany ? tasks.filter((t) => t.companyId === reminderCompany.id) : []}
      />
    </div>
  );
}
