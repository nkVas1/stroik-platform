'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(userId) })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('stroik_token', data.access_token);
        router.push('/dashboard');
      } else {
        alert('Пользователь с таким ID не найден.');
      }
    } catch (e) {
      alert('Ошибка сети');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark bg-blueprint p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border-4 border-black rounded-brutal shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
        <HardHat className="h-16 w-16 text-brand mx-auto mb-6" />
        <h1 className="text-3xl font-black uppercase mb-2">Вход в систему</h1>
        <p className="font-bold opacity-70 mb-8">Для теста введите ваш ID (например: 1, 2, 3)</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            type="number" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="Ваш User ID" 
            className="text-center text-xl font-black h-14"
            required
          />
          <Button type="submit" className="w-full h-14 text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Войти <ArrowRight className="ml-2" />
          </Button>
        </form>
        
        <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-700">
          <Link href="/onboarding" className="text-sm font-bold text-brand hover:underline">
            Нет аккаунта? Зарегистрироваться через ИИ
          </Link>
        </div>
      </div>
    </div>
  );
}
