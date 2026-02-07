import { useState } from 'react';
import { Task, CategoryOption, TeamMember } from '@/types/task';
import { getAssignedNames, getDueCountdown, getDueBreakdown, slugify } from '@/lib/taskUtils';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Building2,
  Globe,
  Presentation,
  Video,
  CreditCard,
  Image,
  Folder,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryTaskListSheet } from './CategoryTaskListSheet';
import { TaskDetailSheet } from './TaskDetailSheet';
import { RippleIcon } from './RippleIcon';

interface DashboardProps {
  tasks: Task[];
  categories: CategoryOption[];
  customCategoryValues: Set<string>;
  teamMembers: TeamMember[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onNewTask?: (categoryValue: string) => void;
  onEditTask?: (task: Task) => void;
  onAddCategory: (category: CategoryOption) => void;
  onEditCategory: (value: string, newLabel: string) => void;
  onDeleteCategory: (value: string) => void;
}

const CATEGORY_COLORS: Record<string, { label: string; glow: string; accent: string; cardBg: string }> = {
  'linkedin-management': { label: 'LinkedIn Management', glow: 'bg-blue-200', accent: 'text-blue-700', cardBg: 'bg-blue-50' },
  'company-profile': { label: 'Company Profile', glow: 'bg-emerald-200', accent: 'text-emerald-700', cardBg: 'bg-emerald-50' },
  website: { label: 'Website', glow: 'bg-teal-200', accent: 'text-teal-700', cardBg: 'bg-teal-50' },
  presentation: { label: 'Presentation', glow: 'bg-violet-200', accent: 'text-violet-700', cardBg: 'bg-violet-50' },
  'corporate-video': { label: 'Corporate Video', glow: 'bg-amber-200', accent: 'text-amber-700', cardBg: 'bg-amber-50' },
  'visiting-card': { label: 'Visiting Card', glow: 'bg-rose-200', accent: 'text-rose-700', cardBg: 'bg-rose-50' },
  banner: { label: 'Banner', glow: 'bg-indigo-200', accent: 'text-indigo-700', cardBg: 'bg-indigo-50' },
  other: { label: 'Other', glow: 'bg-slate-200', accent: 'text-slate-600', cardBg: 'bg-slate-50' },
};

const COLOR_POOL = [
  { glow: 'bg-sky-200', accent: 'text-sky-700', cardBg: 'bg-sky-50' },
  { glow: 'bg-fuchsia-200', accent: 'text-fuchsia-700', cardBg: 'bg-fuchsia-50' },
  { glow: 'bg-orange-200', accent: 'text-orange-700', cardBg: 'bg-orange-50' },
  { glow: 'bg-lime-200', accent: 'text-lime-700', cardBg: 'bg-lime-50' },
  { glow: 'bg-cyan-200', accent: 'text-cyan-700', cardBg: 'bg-cyan-50' },
  { glow: 'bg-pink-200', accent: 'text-pink-700', cardBg: 'bg-pink-50' },
] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'linkedin-management': Briefcase,
  'company-profile': Building2,
  website: Globe,
  presentation: Presentation,
  'corporate-video': Video,
  'visiting-card': CreditCard,
  banner: Image,
  other: Folder,
};

export function Dashboard({
  tasks,
  categories,
  customCategoryValues,
  teamMembers,
  onTaskClick,
  onUpdateTask,
  onNewTask,
  onEditTask,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: DashboardProps) {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState<{ value: string; label: string } | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteCategory, setDeleteCategory] = useState<{ value: string; taskCount: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | null>(null);
  const [taskSummaryTab, setTaskSummaryTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'core'>('all');
  const [summarySelectedTask, setSummarySelectedTask] = useState<Task | null>(null);

  const ongoingStatuses = ['in-progress', 'urgent'] as const;

  const categoriesWithStats = categories.map((category) => {
    const categoryTasks = tasks.filter((t) => t.category === category.value);
    const ongoing = categoryTasks.filter((t) =>
      ongoingStatuses.includes(t.status as (typeof ongoingStatuses)[number])
    ).length;
    const total = categoryTasks.length;
    const breakdown = getDueBreakdown(categoryTasks);
    return {
      value: category.value,
      label: category.label,
      tasks: categoryTasks,
      total,
      ongoing,
      ...breakdown,
    };
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCategoryName.trim();
    if (!label) return;
    const value = slugify(label) || `custom-${Date.now()}`;
    onAddCategory({ value, label });
    setNewCategoryName('');
    setAddCategoryOpen(false);
  };

  const openEdit = (value: string, label: string) => {
    setEditCategory({ value, label });
    setEditLabel(label);
  };

  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !editLabel.trim()) return;
    onEditCategory(editCategory.value, editLabel.trim());
    setEditCategory(null);
    setEditLabel('');
  };

  const openDelete = (value: string) => {
    const taskCount = tasks.filter((t) => t.category === value).length;
    setDeleteCategory({ value, taskCount });
  };

  const handleDeleteCategory = () => {
    if (!deleteCategory) return;
    onDeleteCategory(deleteCategory.value);
    setDeleteCategory(null);
  };

  const getConfig = (value: string, label: string, index: number) => {
    const builtIn = CATEGORY_COLORS[value];
    if (builtIn) return builtIn;
    const pool = COLOR_POOL[index % COLOR_POOL.length];
    return { label, ...pool };
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in max-w-5xl w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">Category cards</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddCategoryOpen(true)}
          className="gap-1.5 sm:gap-2 text-responsive-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          Add category
        </Button>
      </div>

      {categoriesWithStats.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <p className="text-muted-foreground">No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesWithStats.map((cat, index) => {
            const config = getConfig(cat.value, cat.label, index);
            const Icon = CATEGORY_ICONS[cat.value] ?? Folder;
            return (
              <div
                key={cat.value}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCategory({ value: cat.value, label: cat.label })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCategory({ value: cat.value, label: cat.label });
                  }
                }}
                className={cn(
                  'relative overflow-hidden rounded-lg sm:rounded-xl border border-border/70 p-4 sm:p-5 pr-16 sm:pr-20 min-h-[120px] sm:min-h-[140px] shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer',
                  config.cardBg,
                  'dark:bg-card/80',
                  cat.total === 0 && 'opacity-90'
                )}
              >
                {customCategoryValues.has(cat.value) && (
                  <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(cat.value, cat.label)} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDelete(cat.value)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Colored glow behind the circle only */}
                <div
                  className={cn(
                    'absolute -right-10 -top-10 w-44 h-44 rounded-full blur-2xl',
                    config.glow
                  )}
                  aria-hidden
                />

                <div className="relative z-10 flex flex-col gap-0.5">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {config.label}
                  </p>
                  <p className={cn('text-3xl sm:text-4xl font-bold tabular-nums', config.accent)}>
                    {cat.total}
                  </p>
                </div>

                {cat.total > 0 && (cat.taskActive > 0 || cat.overdue > 0 || cat.upcoming > 0) && (
                  <p className="relative z-10 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                    {[
                      cat.taskActive > 0 && `${cat.taskActive} task active`,
                      cat.overdue > 0 && `${cat.overdue} over due`,
                      cat.upcoming > 0 && `${cat.upcoming} upcoming`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}

                <RippleIcon Icon={Icon} accentClass={config.accent} />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Social Media"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A new card will appear on the dashboard. Tasks can use this category when creating a task.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddCategoryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newCategoryName.trim()}>
                Add category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category name</Label>
              <Input
                id="edit-category-name"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editLabel.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteCategory && deleteCategory.taskCount > 0
                ? "Can't delete this category"
                : 'Delete category?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategory && deleteCategory.taskCount > 0
                ? `${deleteCategory.taskCount} task(s) use this category. Reassign or remove those tasks first, then try again.`
                : 'This category will be removed from the dashboard and from the task type list. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteCategory && deleteCategory.taskCount === 0 && (
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryTaskListSheet
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
        category={selectedCategory}
        tasks={tasks}
        teamMembers={teamMembers}
        onUpdateTask={onUpdateTask}
        onNewTask={onNewTask}
        onEditTask={onEditTask}
      />

      <TaskDetailSheet
        task={summarySelectedTask ? (tasks.find((t) => t.id === summarySelectedTask.id) ?? summarySelectedTask) : null}
        open={!!summarySelectedTask}
        onOpenChange={(open) => !open && setSummarySelectedTask(null)}
        teamMembers={teamMembers}
        onUpdateTask={onUpdateTask}
        onEditTask={onEditTask}
      />

      {/* Task summary: Today's, Upcoming, Overdue, Core */}
      <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const todayTasks = tasks.filter(
            (t) => t.endDate === today && t.status !== 'completed'
          );
          const upcomingTasks = tasks.filter(
            (t) => t.endDate > today && t.status !== 'completed'
          );
          const overdueTasks = tasks.filter(
            (t) => t.endDate < today && t.status !== 'completed'
          );
          const coreTasks = tasks.filter((t) => t.isCoreTask === true && t.status !== 'completed');

          const allTaskIds = new Set([
            ...todayTasks.map((t) => t.id),
            ...upcomingTasks.map((t) => t.id),
            ...overdueTasks.map((t) => t.id),
            ...coreTasks.map((t) => t.id),
          ]);
          const tabs: { id: 'all' | 'today' | 'upcoming' | 'overdue' | 'core'; label: string; count: number }[] = [
            { id: 'all', label: 'Show All', count: allTaskIds.size },
            { id: 'today', label: "Today's tasks", count: todayTasks.length },
            { id: 'upcoming', label: 'Upcoming tasks', count: upcomingTasks.length },
            { id: 'overdue', label: 'Overdue tasks', count: overdueTasks.length },
            { id: 'core', label: 'Core tasks', count: coreTasks.length },
          ];

          const handleToggleComplete = (task: Task) => {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            onUpdateTask({
              ...task,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            });
          };

          const groupByCategory = (list: Task[]) => {
            const groups: { label: string; value: string; tasks: Task[] }[] = [];
            for (const cat of categories) {
              const tasksInCat = list.filter((t) => t.category === cat.value);
              if (tasksInCat.length > 0)
                groups.push({ label: cat.label, value: cat.value, tasks: tasksInCat });
            }
            const uncategorized = list.filter(
              (t) => !categories.some((c) => c.value === t.category)
            );
            if (uncategorized.length > 0)
              groups.push({ label: 'Other', value: '_other', tasks: uncategorized });
            return groups;
          };

          const TaskList = ({ list, label }: { list: Task[]; label: string }) => (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {label}
              </p>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">None</p>
              ) : (
                <div className="space-y-5">
                  {groupByCategory(list).map((group) => (
                    <div key={group.value}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {group.label} ({group.tasks.length})
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.tasks.map((task) => {
                    const isComplete = task.status === 'completed';
                    const due = getDueCountdown(task.endDate, task.endTime);
                    const assignedNames = getAssignedNames(task.assignedTo, teamMembers);
                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSummarySelectedTask(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSummarySelectedTask(task);
                          }
                        }}
                        className={cn(
                          'rounded-xl border bg-card p-4 shadow-sm transition-colors cursor-pointer hover:shadow-md flex gap-3 text-left',
                          isComplete && 'opacity-75'
                        )}
                      >
                        <Checkbox
                          checked={isComplete}
                          onCheckedChange={() => handleToggleComplete(task)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 shrink-0"
                          aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={cn(
                                'font-medium text-foreground flex-1 min-w-0 truncate',
                                isComplete && 'line-through text-muted-foreground'
                              )}
                            >
                              {task.title}
                            </h3>
                            <span
                              className={cn(
                                'shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded',
                                task.priority === 'high' && 'bg-destructive/10 text-destructive',
                                task.priority === 'medium' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                                task.priority === 'low' && 'bg-muted text-muted-foreground'
                              )}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[120px]" title={task.companyName}>
                                {task.companyName}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[100px]" title={assignedNames}>
                                {assignedNames}
                              </span>
                            </span>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5">
                            <p
                              className={cn(
                                'text-xs font-semibold tabular-nums',
                                due.overdue ? 'text-destructive' : 'text-primary'
                              )}
                            >
                              {due.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

          const showAll = taskSummaryTab === 'all';
          const showToday = showAll || taskSummaryTab === 'today';
          const showUpcoming = showAll || taskSummaryTab === 'upcoming';
          const showOverdue = showAll || taskSummaryTab === 'overdue';
          const showCore = showAll || taskSummaryTab === 'core';

          return (
            <>
              <div className="flex flex-wrap items-center gap-6 border-b border-border/70 pb-4 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTaskSummaryTab(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 pb-3 -mb-px text-sm font-medium transition-colors border-b-2',
                      taskSummaryTab === tab.id
                        ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs flex items-center justify-center font-medium',
                        'bg-muted/80',
                        taskSummaryTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-5">
                {showToday && <TaskList list={todayTasks} label="Today's tasks" />}
                {showUpcoming && <TaskList list={upcomingTasks} label="Upcoming tasks" />}
                {showOverdue && <TaskList list={overdueTasks} label="Overdue tasks" />}
                {showCore && <TaskList list={coreTasks} label="Core tasks" />}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
