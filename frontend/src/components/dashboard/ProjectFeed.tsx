'use client';

import { AlertCircle, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { API_URL } from '@/lib/api';

interface Project {
  id: number;
  title: string;
  description?: string;
  budget?: number;
  specialization?: string;
  employer_name: string;
  location: string;
  created_at?: string;
}

interface ProjectFeedProps {
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectFeed({ projects, onRefresh }: ProjectFeedProps) {
  const handleBid = async (projectId: number) => {
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cover_letter: 'Здравствуйте! Готов обсудить детали и приступить к работе.' }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const error = await res.json();
        alert(`❌ ${error.detail}`);
      }
    } catch {
      alert('❌ Ошибка сети');
    }
  };

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase flex items-center gap-2">
          <Search className="text-brand" /> Доступные заказы
        </h2>
        <span className="text-xs font-bold bg-green-100 text-green-800 border-2 border-green-800 px-2 py-1 rounded-full animate-pulse">
          Live
        </span>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-400 rounded-brutal flex flex-col items-center text-center">
            <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
            <p className="font-bold text-gray-500">Пока нет открытых заказов.</p>
            <p className="text-xs text-gray-400 mt-1">Попросите заказчика создать объект.</p>
          </div>
        ) : (
          projects.map(proj => (
            <div
              key={proj.id}
              className="p-5 bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal hover:-translate-y-1 hover:shadow-brutal-light transition-all flex flex-col md:flex-row gap-4 justify-between"
            >
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase font-black">
                    {proj.specialization || 'Разное'}
                  </span>
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                    <MapPin size={12} /> {proj.location}
                  </span>
                </div>
                <h3 className="font-black text-lg leading-tight">{proj.title}</h3>
                <p className="text-sm opacity-70 mt-2 line-clamp-2">{proj.description}</p>
                <p className="text-xs font-bold opacity-50 mt-3">Заказчик: {proj.employer_name}</p>
              </div>
              <div className="flex flex-col justify-between items-start md:items-end shrink-0 border-t-2 md:border-t-0 md:border-l-2 border-gray-200 dark:border-gray-800 pt-4 md:pt-0 md:pl-4">
                <p className="font-black text-xl text-brand">
                  {proj.budget ? `${proj.budget.toLocaleString('ru-RU')} ₽` : 'Договорная'}
                </p>
                <Button size="sm" onClick={() => handleBid(proj.id)} className="w-full md:w-auto text-xs font-bold uppercase mt-2">
                  Откликнуться
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
