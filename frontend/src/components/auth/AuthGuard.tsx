'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Высокоуровневый компонент для защиты приватных страниц.
 * Проверяет наличие токена перед рендерингом содержимого.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('stroik_token');
    if (!token) {
      router.push('/onboarding');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-black border-t-brand rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-lg">ПРОВЕРКА ДОСТУПА...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
