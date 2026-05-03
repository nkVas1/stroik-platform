'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as UserIcon, Building, Edit3, CheckCircle, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiPut, apiGet } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Profile {
  id: number;
  role: string;
  fio?: string;
  location?: string;
  specialization?: string;
  experience_years?: number;
  verification_level: number;
  entity_type?: string;
  company_name?: string;
}

interface VerifStatus {
  score: number;       // 0-100, step-based (same as VerificationWidget)
  level: number;
  steps: {
    fio_location: boolean;
    portfolio: boolean;
    passport: boolean;
  };
}

interface ProfileCardProps {
  profile: Profile;
  onUpdated: () => void;
}

export function ProfileCard({ profile, onUpdated }: ProfileCardProps) {
  const toast = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fio: profile.fio || '',
    location: profile.location || '',
    specialization: profile.specialization || '',
    experience_years: profile.experience_years?.toString() || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Trust score loaded from the same endpoint as VerificationWidget
   * so both always show identical numbers.
   */
  const [verifStatus, setVerifStatus] = useState<VerifStatus | null>(null);

  const loadVerif = useCallback(async () => {
    try {
      const data = await apiGet<VerifStatus>('/api/verification/status');
      setVerifStatus(data);
    } catch {
      // graceful fallback: derive from level only if API fails
      const fallbackScore = Math.min((profile.verification_level / 3) * 100, 100);
      setVerifStatus({ score: fallbackScore, level: profile.verification_level, steps: { fio_location: false, portfolio: false, passport: false } });
    }
  }, [profile.verification_level]);

  useEffect(() => { loadVerif(); }, [loadVerif]);

  // Re-fetch score after profile update
  const handleUpdated = useCallback(() => {
    onUpdated();
    loadVerif();
  }, [onUpdated, loadVerif]);

  const isWorker = profile.role === 'worker';
  const progressPercent = verifStatus?.score ?? Math.min((profile.verification_level / 3) * 100, 100);
  const displayName = profile.fio || profile.company_name || (isWorker ? 'Специалист' : 'Заказчик');

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiPut('/api/users/me/manual', {
        fio: editForm.fio || null,
        location: editForm.location || null,
        specialization: editForm.specialization || null,
        experience_years: editForm.experience_years ? parseInt(editForm.experience_years) : null,
      });
      setShowEditModal(false);
      toast.success('Профиль успешно обновлён!');
      handleUpdated();
    } catch {
      toast.error('Ошибка при сохранении. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { apiFetch } = await import('@/lib/api');
      await apiFetch('/api/users/me/verify-document', { method: 'POST', body: formData });
      toast.success('Документ принят! Уровень доверия: Максимальный.');
      handleUpdated();
    } catch {
      toast.error('Ошибка при загрузке файла.');
    }
  };

  const verificationLabels: Record<number, { label: string; color: string }> = {
    0: { label: 'Не верифицирован',       color: 'text-gray-500'   },
    1: { label: 'Базовая (ФИО + Город)',   color: 'text-yellow-600' },
    2: { label: 'Расширенная',             color: 'text-blue-600'   },
    3: { label: 'Паспорт (PRO)',           color: 'text-green-600'  },
  };
  const verif = verificationLabels[profile.verification_level] ?? verificationLabels[0];

  return (
    <>
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black uppercase">Редактирование</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="font-black text-xl hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">ФИО</label>
                <Input
                  value={editForm.fio}
                  onChange={e => setEditForm({ ...editForm, fio: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Город</label>
                <Input
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Москва"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Специализация</label>
                <Input
                  value={editForm.specialization}
                  onChange={e => setEditForm({ ...editForm, specialization: e.target.value })}
                  placeholder="Плиточник, Электрик..."
                />
              </div>
              {isWorker && (
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Опыт (лет)</label>
                  <Input
                    type="number"
                    value={editForm.experience_years}
                    onChange={e => setEditForm({ ...editForm, experience_years: e.target.value })}
                    placeholder="5"
                    min={0}
                    max={60}
                  />
                </div>
              )}
              <Button type="submit" className="w-full mt-4 h-12 border-2 border-black" disabled={isSaving}>
                {isSaving ? 'Сохраняем...' : 'Сохранить изменения'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <section className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark flex flex-col md:flex-row gap-6 items-center">
        <div className="w-20 h-20 bg-brand text-black border-2 border-black rounded-full flex items-center justify-center shrink-0">
          {isWorker ? <UserIcon size={40} /> : <Building size={40} />}
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-1">
            <h1 className="text-2xl font-black uppercase">{displayName}</h1>
            <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-brutal flex items-center gap-1">
              <MapPin size={10} /> {profile.location || 'Город не указан'}
            </span>
          </div>
          <p className="font-bold opacity-70 mb-1 text-sm">
            {profile.specialization || 'Специализация не указана'}
            {isWorker && profile.experience_years ? ` · ${profile.experience_years} л. опыта` : ''}
          </p>
          <p className={`text-xs font-black uppercase mb-4 flex items-center gap-1 justify-center md:justify-start ${verif.color}`}>
            <CheckCircle size={12} /> {verif.label}
          </p>

          <div className="w-full flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold uppercase mb-1">
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-gray-400" />
                  Доверие профилю
                </span>
                <span className={progressPercent === 100 ? 'text-green-600 font-black' : 'font-black'}>
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full border-2 border-black overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    progressPercent === 100 ? 'bg-green-500' : 'bg-brand'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Step hints below bar */}
              {verifStatus && (
                <div className="flex gap-3 mt-1.5">
                  {([
                    { key: 'fio_location' as const, label: 'ФИО+Город' },
                    { key: 'portfolio'    as const, label: 'Портфолио' },
                    { key: 'passport'    as const, label: 'Паспорт'   },
                  ]).map(s => (
                    <span key={s.key} className={`text-[10px] font-bold ${
                      verifStatus.steps[s.key] ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {verifStatus.steps[s.key] ? '✓' : '○'} {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="border-2 border-black gap-2 shrink-0"
            >
              <Edit3 size={14} /> Изменить
            </Button>
          </div>

          {profile.verification_level < 3 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-gray-800 border-2 border-dashed border-brand rounded-brutal flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs font-black uppercase text-amber-700 dark:text-brand">Получите PRO-статус</p>
                <p className="text-xs font-bold opacity-60">Загрузите фото паспорта — доверие 100%</p>
              </div>
              <div className="relative shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleDocumentUpload}
                />
                <Button variant="primary" size="sm" className="pointer-events-none">Загрузить</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
