'use client';

import { useAuth } from '@/components/auth-provider';
import Dashboard from './dashboard/page';
import Login from './login/page';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}
