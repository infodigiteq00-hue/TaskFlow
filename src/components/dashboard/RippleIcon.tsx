import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface RippleIconProps {
  Icon: LucideIcon;
  accentClass: string;
}

export function RippleIcon({ Icon, accentClass }: RippleIconProps) {
  return (
    <div className="absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <span className={cn('absolute w-full h-full rounded-full border border-current/35', accentClass)} />
        <span className={cn('absolute w-[80%] h-[80%] rounded-full border border-current/28', accentClass)} />
        <span className={cn('absolute w-[60%] h-[60%] rounded-full border border-current/20', accentClass)} />
        <span className={cn('absolute w-[45%] h-[45%] rounded-full bg-current/18', accentClass)} />
        <span
          className={cn(
            'absolute w-[32%] h-[32%] rounded-full bg-current/12 flex items-center justify-center',
            accentClass
          )}
        >
          <Icon className={cn('w-9 h-9', accentClass)} style={{ opacity: 0.7 }} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
