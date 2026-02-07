import { Task, TaskStatus, TASK_CATEGORIES } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Users, ExternalLink, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { mockTeamMembers } from '@/data/mockData';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  urgent: 'Urgent',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const category = TASK_CATEGORIES.find(c => c.value === task.category);
  const assignees = mockTeamMembers.filter(m => task.assignedTo.includes(m.id));
  
  return (
    <Card 
      className={cn(
        'p-4 hover-lift cursor-pointer border-l-4 animate-fade-in',
        task.status === 'urgent' && 'border-l-destructive',
        task.status === 'in-progress' && 'border-l-info',
        task.status === 'completed' && 'border-l-success',
        task.status === 'pending' && 'border-l-warning'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category & Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{category?.icon}</span>
            <span className="text-xs text-muted-foreground font-medium">
              {category?.label}
            </span>
            <Badge variant={task.status} className="ml-auto">
              {statusLabels[task.status]}
            </Badge>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-foreground truncate mb-1">
            {task.title}
          </h3>
          
          {/* Company */}
          <p className="text-sm text-muted-foreground mb-3">
            {task.companyName}
          </p>
          
          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(task.endDate), 'MMM d')}</span>
            </div>
            
            {assignees.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{assignees.length}</span>
              </div>
            )}
            
            {task.finalFileUrl && (
              <div className="flex items-center gap-1 text-success">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>File attached</span>
              </div>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Assignees avatars */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground ring-2 ring-card"
                title={member.name}
              >
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                +{assignees.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {assignees.map(a => a.name.split(' ')[0]).slice(0, 2).join(', ')}
            {assignees.length > 2 && ` +${assignees.length - 2}`}
          </span>
        </div>
      )}
    </Card>
  );
}
