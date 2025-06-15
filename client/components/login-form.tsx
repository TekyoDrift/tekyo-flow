'use client';

import { useState } from 'react';
import { GalleryVerticalEnd } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        login(data.token, data.account);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, auto-login
        login(data.token, data.account);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={isSigningUp ? handleSignupSubmit : handleLoginSubmit}>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <a href='#' className='flex flex-col items-center gap-2 font-medium'>
              <div className='flex size-8 items-center justify-center rounded-md'>
                <GalleryVerticalEnd className='size-6' />
              </div>
              <span className='sr-only'>Tekyo Flow</span>
            </a>
            <h1 className='text-xl font-bold'>Welcome to Tekyo Drift Flow</h1>
            {!isSigningUp ? (
              <div className='text-center text-sm'>
                Don&apos;t have an account?{' '}
                <a onClick={() => setIsSigningUp(true)} className='underline underline-offset-4 cursor-pointer'>
                  Sign up
                </a>
              </div>
            ) : (
              <div className='text-center text-sm'>
                Already have an account?{' '}
                <a onClick={() => setIsSigningUp(false)} className='underline underline-offset-4 cursor-pointer'>
                  Sign in
                </a>
              </div>
            )}
          </div>

          {error && (
            <div className='text-sm text-red-600 text-center bg-red-50 p-3 rounded-md border border-red-200'>
              {error}
            </div>
          )}

          {!isSigningUp ? (
            <div className='flex flex-col gap-6'>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='john.doe@epitech.eu'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className='grid gap-3'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                  <a href='#' className='ml-auto text-sm underline-offset-2 hover:underline'>
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type='submit' className='w-full cursor-pointer' disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          ) : (
            <div className='flex flex-col gap-6'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-3'>
                  <Label htmlFor='firstname'>First Name</Label>
                  <Input
                    id='firstname'
                    type='text'
                    placeholder='John'
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className='grid gap-3'>
                  <Label htmlFor='lastname'>Last Name</Label>
                  <Input
                    id='lastname'
                    type='text'
                    placeholder='Doe'
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='john.doe@epitech.eu'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <Button type='submit' className='w-full cursor-pointer' disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          )}
        </div>
      </form>
      <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>.
      </div>
    </div>
  );
}
