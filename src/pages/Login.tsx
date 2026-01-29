import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cookie, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast.success('Welcome back!');
      navigate(redirect);
    } else {
      toast.error('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Cookie className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-1 text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-bakery">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-bakery mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-bakery pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full rounded-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Demo Accounts */}
          <div className="mt-6 rounded-xl bg-muted p-4">
            <p className="text-sm font-medium text-foreground">Demo Accounts:</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Customer: demo@example.com / demo123<br />
              Admin: admin@sweetbites.com / admin123<br />
              Staff: staff@sweetbites.com / staff123
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
