import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import type { Task } from '@/types/task';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  /** Number of tasks with an active reminder (not completed). Badge shows this count. */
  reminderCount?: number;
  /** Tasks that have an active reminder; shown in the bell dropdown. */
  reminderTasks?: Task[];
  /** Called when user clicks a task in the reminder list to show its reminder popup. */
  onReminderClick?: (task: Task) => void;
}

export function Header({ title, subtitle, onMenuClick, reminderCount = 0, reminderTasks = [], onReminderClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || 'User';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const showBadge = reminderCount > 0;
  const badgeLabel = reminderCount > 99 ? '99+' : String(reminderCount);

  return (
    <header className="sticky top-0 z-40 h-14 min-h-14 sm:h-16 shrink-0 bg-card border-b border-border flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 h-9 w-9"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative hidden md:block w-40 lg:w-52 xl:w-64">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            className="pl-8 sm:pl-10 w-full bg-secondary/50 border-0 focus-visible:ring-accent text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0" aria-label="Reminders">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {showBadge && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badgeLabel}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 sm:w-64">
            <DropdownMenuLabel>Reminders</DropdownMenuLabel>
            {reminderTasks.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">No upcoming reminders</div>
            ) : (
              reminderTasks.map((task) => (
                <DropdownMenuItem
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => onReminderClick?.(task)}
                >
                  <span className="truncate">{task.title}</span>
                  {task.companyName && (
                    <span className="ml-1 text-muted-foreground truncate text-xs">· {task.companyName}</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 shrink-0">
              <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
              {displayName}
            </div>
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive text-sm">
              <LogOut className="w-4 h-4 mr-2 shrink-0" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
