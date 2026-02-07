import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || 'User';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="h-14 min-h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
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

        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </Button>

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
