import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Plus, MoreHorizontal } from 'lucide-react';
import { TeamMember } from '@/types/task';
import { Task } from '@/types/task';
import { AddMemberDialog } from './AddMemberDialog';

interface TeamListProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onAddMember: (member: TeamMember) => void;
}

export function TeamList({ teamMembers, tasks, onAddMember }: TeamListProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Team Members</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your team</p>
        </div>
        <Button variant="accent" className="gap-1.5 sm:gap-2 text-sm sm:text-base w-full sm:w-auto shrink-0" onClick={() => setAddMemberOpen(true)}>
          <Plus className="w-4 h-4 shrink-0" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {teamMembers.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id));
          const activeTasks = memberTasks.filter((t) => t.status !== 'completed').length;
          const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;

          return (
            <Card key={member.id} className="p-4 sm:p-5 hover-lift cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-sm sm:text-lg text-primary-foreground font-semibold shrink-0">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">{member.department}</Badge>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 truncate">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>

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
              </div>
            </Card>
          );
        })}
      </div>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAddMember={onAddMember}
      />
    </div>
  );
}
