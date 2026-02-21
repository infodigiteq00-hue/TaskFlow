import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Building2, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewTask: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
  /** Unread chat message count; badge hidden when 0 or undefined */
  unreadChatCount?: number;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'All Tasks', icon: CheckSquare },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'chat', label: 'Team Chat', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar({ activeView, onViewChange, onNewTask, mobileOpen = false, onClose, unreadChatCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (view: string) => {
    onViewChange(view);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col',
          'w-64 lg:w-64',
          collapsed && 'lg:w-16',
          'max-lg:translate-x-0 max-lg:shadow-xl',
          !mobileOpen && 'max-lg:-translate-x-full'
        )}
      >
      {/* Logo */}
      <Link to="/taskflow" className="flex items-center h-14 min-h-14 sm:h-16 px-3 sm:px-4 border-b border-sidebar-border hover:opacity-90 transition-opacity shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base sm:text-lg tracking-tight truncate">TaskFlow</span>
          )}
        </div>
      </Link>

      {/* New Task Button */}
      <div className="p-2 sm:p-3 shrink-0">
        <Button
          onClick={() => { onNewTask(); onClose?.(); }}
          variant="accent"
          size="sm"
          className={cn(
            'w-full justify-center gap-1.5 sm:gap-2 text-responsive-sm',
            collapsed ? 'px-2' : 'px-3 sm:px-4'
          )}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          {!collapsed && <span>New Task</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 sm:px-3 py-2 space-y-0.5 sm:space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-responsive-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.id === 'chat' && !collapsed && unreadChatCount > 0 && (
                <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-[10px] sm:text-xs min-w-[1.25rem] px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 text-center">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings & Collapse */}
      <div className="p-2 sm:p-3 border-t border-sidebar-border space-y-0.5 shrink-0">
        <button
          onClick={() => handleNavClick('settings')}
          className={cn(
            'w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-responsive-sm font-medium transition-colors',
            activeView === 'settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full hidden lg:flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-responsive-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
