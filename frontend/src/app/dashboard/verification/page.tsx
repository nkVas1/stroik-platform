'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, ShieldCheck, User, Briefcase,
  FileText, CheckCircle, Clock, XCircle,
  Upload, ChevronRight, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPostForm } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface VerificationStatus {
  level: number;
  doc_status?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  cases_count?: number;
}

const DOC_TYPES = [
  { value: 'passport', label: 'Паспорт' },
  { value: 'inn', label: 'ИНН / Свидетельство ИП' },
  { value: 'contract_scan', label: 'Договор (скан)' },
];

const STATUS_BADGE = {
  not_submitted: { label: 'Не загружен', color: 'bg-gray-100 text-gray-500', icon: AlertCircle },
  pending: { label: 'На проверке', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Проверен', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-600', icon: XCircle },
};

export default function VerificationPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<VerificationStatus>({ level: 0, doc_status: 'not_submitted' });
  const [isLoading, setIsLoading] = useState(true);
  const [docType, setDocType] = useState('passport');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await apiGet<VerificationStatus>('/api/verification/status');
      setStatus(s);
    } catch {
      // fallback: derive level from profile completeness
      try {
        const me = await apiGet<{ fio?: string; location?: string; specialization?: string; verification_level?: number }>('/api/users/me');
        setStatus({ level: me.verification_level ?? 0, doc_status: 'not_submitted' });
      } catch {
        setStatus({ level: 0, doc_status: 'not_submitted' });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDocUpload = async () => {
    if (!docFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('doc_type', docType);
      await apiPostForm('/api/verification/document', fd);
      toast.success('Документ отправлен на проверку! Обычно 1-2 дня.');
      setDocFile(null);
      setStatus(prev => ({ ...prev, doc_status: 'pending' }));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  const level = status.level;
  const docStatusKey = (status.doc_status ?? 'not_submitted') as keyof typeof STATUS_BADGE;
  const DocStatusBadge = STATUS_BADGE[docStatusKey];
  const StatusIcon = DocStatusBadge.icon;

  const steps = [
    {
      lvl: 1,
      icon: User,
      title: 'Базовый профиль',
      desc: 'Заполните ФИО, город и специализацию',
      cta: { href: '/dashboard/settings', label: 'Заполнить профиль' },
    },
    {
      lvl: 2,
      icon: Briefcase,
      title: 'Портфолио',
      desc: 'Добавьте минимум 1 кейс с фотографиями',
      cta: { href: '/dashboard/portfolio/new', label: 'Добавить кейс' },
    },
    {
      lvl: 3,
      icon: FileText,
      title: 'Документ PRO',
      desc: 'Загрузите паспорт, ИНН или договор для PRO-верификации',
      cta: null,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Кабинет
        </Link>
        <div className="flex-1" />
        <ShieldCheck size={16} className={level >= 3 ? 'text-green-500' : 'text-gray-400'} />
      </div>

      <div className="max-w-xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-black text-3xl uppercase">Верификация</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Профиль с верификацией вызывает больше доверия и получает больше заказов
          </p>
        </div>

        {/* Progress */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 mb-6 shadow-brutal-light dark:shadow-brutal-dark">
          <div className="flex justify-between text-xs font-bold uppercase mb-2">
            <span>Доверие профиля</span>
            <span className={level >= 3 ? 'text-green-600' : 'text-brand'}>{Math.round((level / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full border border-black overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                level >= 3 ? 'bg-green-500' : 'bg-brand'
              }`}
              style={{ width: `${Math.round((level / 3) * 100)}%` }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-24 border-2 border-black rounded-brutal animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map(step => {
              const done = level >= step.lvl;
              const active = level === step.lvl - 1;
              const Icon = step.icon;
              return (
                <div
                  key={step.lvl}
                  className={`bg-surface-cardLight dark:bg-surface-cardDark border-2 rounded-brutal p-5 ${
                    done ? 'border-green-400' : active ? 'border-brand' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-brutal border-2 border-black flex items-center justify-center ${
                      done ? 'bg-green-500' : active ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {done
                        ? <CheckCircle size={18} className="text-white" />
                        : <Icon size={18} className={active ? 'text-black' : 'text-gray-400'} />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm uppercase">{step.title}</h3>
                        <span className="text-[10px] font-black text-gray-400">Ур. {step.lvl}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">{step.desc}</p>

                      {/* Level 3 doc upload block */}
                      {step.lvl === 3 && active && (
                        <div className="mt-4 space-y-3">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-brutal text-xs font-black ${DocStatusBadge.color}`}>
                            <StatusIcon size={11} /> {DocStatusBadge.label}
                          </div>

                          {docStatusKey !== 'pending' && docStatusKey !== 'approved' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Тип документа</label>
                                <div className="flex gap-2 flex-wrap">
                                  {DOC_TYPES.map(d => (
                                    <button key={d.value} type="button" onClick={() => setDocType(d.value)}
                                      className={`px-3 py-1.5 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                                        docType === d.value ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500'
                                      }`}>
                                      {d.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {docFile ? (
                                <div className="flex items-center gap-3 p-3 border-2 border-green-400 bg-green-50 dark:bg-green-900/20 rounded-brutal">
                                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-xs truncate">{docFile.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{(docFile.size / 1024).toFixed(0)} KB</p>
                                  </div>
                                  <button onClick={() => setDocFile(null)} className="text-red-400">
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div onClick={() => fileInputRef.current?.click()}
                                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-brutal p-6 text-center cursor-pointer hover:border-brand transition-colors">
                                  <Upload size={22} className="mx-auto text-gray-300 mb-1" />
                                  <p className="font-black text-xs text-gray-500">Нажмите для загрузки</p>
                                  <p className="text-[10px] font-bold text-gray-400">PDF, JPG, PNG</p>
                                  <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png"
                                    className="hidden" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                                </div>
                              )}

                              <Button size="sm" disabled={!docFile || isUploading} onClick={handleDocUpload}
                                className="gap-2 border-2 border-black font-black uppercase text-xs bg-brand text-black">
                                <Upload size={12} /> {isUploading ? 'Отправка...' : 'Отправить на проверку'}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {/* CTA for incomplete steps */}
                      {!done && step.cta && (
                        <Link href={step.cta.href}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand hover:underline">
                          {step.cta.label} <ChevronRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs font-bold text-gray-400 text-center">
          Данные документов хранятся зашифрованно · Не передаются третьим лицам
        </p>
      </div>
    </div>
  );
}
