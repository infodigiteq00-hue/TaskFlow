import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/taskflow', { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err.message ?? 'Sign in failed');
      return;
    }
    navigate('/taskflow', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-3 sm:p-4 md:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Link
        to="/"
        className="relative z-10 flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 text-foreground hover:opacity-90 transition-opacity"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent flex items-center justify-center shadow-md shrink-0">
          <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
        </div>
        <span className="font-bold text-lg sm:text-xl tracking-tight">TaskFlow</span>
      </Link>

      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 glass-form mx-2 sm:mx-0',
          'animate-fade-in'
        )}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Welcome back</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          Sign in to your account to continue.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-border/80 focus-visible:ring-accent"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <Link
                to="/login"
                className="text-xs text-accent hover:text-accent/90 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-border/80 focus-visible:ring-accent"
              autoComplete="current-password"
              required
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            className="w-full h-10 sm:h-11 rounded-lg text-sm sm:text-base"
            size="lg"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/" className="font-medium text-accent hover:text-accent/90">
            Sign up
          </Link>
        </p>
      </div>

    
    </div>
  );
}
