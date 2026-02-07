import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Linkedin, Plus, MoreHorizontal } from 'lucide-react';
import { Company, Task } from '@/types/task';

interface CompanyListProps {
  companies: Company[];
  tasks: Task[];
}

export function CompanyList({ companies, tasks }: CompanyListProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Companies</h2>
          <p className="text-muted-foreground text-sm">Manage your client companies</p>
        </div>
        <Button variant="accent" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => {
          const companyTasks = tasks.filter(t => t.companyId === company.id);
          const activeTasks = companyTasks.filter(t => t.status !== 'completed').length;
          const completedTasks = companyTasks.filter(t => t.status === 'completed').length;

          return (
            <Card key={company.id} className="p-5 hover-lift cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{company.name}</h3>
                    {company.linkedInSubscription && (
                      <Badge variant="info" className="mt-1 gap-1">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn Active
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {company.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail className="w-4 h-4" />
                  {company.contactEmail}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-foreground">{activeTasks}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-success">{completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-foreground">{companyTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
