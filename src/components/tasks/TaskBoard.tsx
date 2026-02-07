import { useState } from 'react';
import { Task, TaskStatus, STATUS_OPTIONS, TeamMember } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

function getAssignedNames(assignedTo: string[], teamMembers: TeamMember[]): string {
  if (!assignedTo.length) return '';
  return assignedTo
    .map((id) => teamMembers.find((m) => m.id === id)?.name)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

interface TaskBoardProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  onTaskClick?: (task: Task) => void;
}

function matchesSearch(task: Task, q: string, teamMembers: TeamMember[]): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const byAssigned =
    teamMembers.length > 0 &&
    getAssignedNames(task.assignedTo, teamMembers).toLowerCase().includes(lower);
  return (
    task.title.toLowerCase().includes(lower) ||
    (task.description?.toLowerCase().includes(lower) ?? false) ||
    task.companyName.toLowerCase().includes(lower) ||
    byAssigned
  );
}

const columnConfig: { status: TaskStatus; color: string }[] = [
  { status: 'urgent', color: 'bg-destructive' },
  { status: 'pending', color: 'bg-warning' },
  { status: 'in-progress', color: 'bg-info' },
  { status: 'completed', color: 'bg-success' },
];

export function TaskBoard({ tasks, teamMembers = [], onTaskClick }: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTasks = tasks.filter((t) => matchesSearch(t, searchQuery, teamMembers));

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search by title, description, company, or team member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          aria-label="Search tasks"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 min-h-0">
      {columnConfig.map(({ status, color }) => {
        const columnTasks = filteredTasks.filter(t => t.status === status);
        const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
        
        return (
          <div key={status} className="flex flex-col min-h-0">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className={cn('w-3 h-3 rounded-full', color)} />
              <h3 className="font-semibold text-foreground">{label}</h3>
              <span className="ml-auto bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            {/* Tasks */}
            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
