import { Task, TaskStatus, TASK_CATEGORIES, TeamMember } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Users, ExternalLink, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  teamMembers?: TeamMember[];
  onClick?: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  urgent: 'Urgent',
};

export function TaskCard({ task, teamMembers = [], onClick }: TaskCardProps) {
  const category = TASK_CATEGORIES.find((c) => c.value === task.category);
  const assignees = teamMembers.filter((m) => task.assignedTo.includes(m.id));
  
  return (
    <Card 
      className={cn(
        'p-3 sm:p-4 hover-lift cursor-pointer border-l-4 animate-fade-in',
        task.status === 'urgent' && 'border-l-destructive',
        task.status === 'in-progress' && 'border-l-info',
        task.status === 'completed' && 'border-l-success',
        task.status === 'pending' && 'border-l-warning'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <span className="text-base sm:text-lg shrink-0">{category?.icon}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
              {category?.label}
            </span>
            <Badge variant={task.status} className="ml-auto text-[10px] sm:text-xs shrink-0">
              {statusLabels[task.status]}
            </Badge>
          </div>

          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate mb-1">
            {task.title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 truncate">
            {task.companyName}
          </p>
          
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{format(new Date(task.endDate), 'MMM d')}</span>
            </div>
            {assignees.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>{assignees.length}</span>
              </div>
            )}
            {task.finalFileUrl && (
              <div className="flex items-center gap-1 text-success">
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>File attached</span>
              </div>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 -mt-1 -mr-1">
          <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {assignees.length > 0 && (
        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border min-w-0">
          <div className="flex -space-x-2 shrink-0">
            {assignees.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center text-[9px] sm:text-[10px] font-semibold text-primary-foreground ring-2 ring-card"
                title={member.name}
              >
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                +{assignees.length - 3}
              </div>
            )}
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2 truncate min-w-0">
            {assignees.map(a => a.name.split(' ')[0]).slice(0, 2).join(', ')}
            {assignees.length > 2 && ` +${assignees.length - 2}`}
          </span>
        </div>
      )}
    </Card>
  );
}
