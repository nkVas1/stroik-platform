'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, Zap, Users, Building2,
  CreditCard, Star, X as XIcon, ArrowLeft, Mail,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const PLANS = [
  {
    id: 'free',
    label: 'FREE',
    price: '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e',
    sub: null,
    icon: Star,
    headerBg: 'bg-gray-100 dark:bg-gray-800',
    headerText: 'text-gray-800 dark:text-gray-200',
    cardBorder: 'border-gray-300 dark:border-gray-600',
    activeBorder: 'border-green-500',
    badge: null,
    badgeColor: '',
    ctaBg: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
    features: [
      '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c',
      '\u0414\u043e 3 \u0444\u043e\u0442\u043e / \u043a\u0435\u0439\u0441\u043e\u0432',
      '\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u0437\u0430\u043a\u0430\u0437\u043e\u0432',
      '\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u043d\u044b\u0435 \u043e\u0442\u043a\u043b\u0438\u043a\u0438',
      '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u0447\u0430\u0442',
    ],
    missing: ['\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u043d\u0430\u044f \u0432\u044b\u0434\u0430\u0447\u0430', 'AI-\u043f\u043e\u0434\u0431\u043e\u0440', '\u0412\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u043a\u0435\u0439\u0441\u043e\u0432'],
  },
  {
    id: 'start',
    label: 'START',
    price: '1\u00a0990 \u20bd',
    sub: '\u0432 \u043c\u0435\u0441',
    icon: Zap,
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    cardBorder: 'border-blue-400',
    activeBorder: 'border-green-500',
    badge: null,
    badgeColor: '',
    ctaBg: 'bg-blue-600 text-white',
    features: [
      '\u0414\u043e 10 \u043e\u0442\u043a\u043b\u0438\u043a\u043e\u0432 / \u043c\u0435\u0441',
      '\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u044b\u0439 \u043f\u0440\u043e\u0444\u0438\u043b\u044c',
      '\u0411\u0430\u0437\u043e\u0432\u0430\u044f \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430',
      'AI-\u043f\u043e\u0434\u0431\u043e\u0440 \u0437\u0430\u044f\u0432\u043e\u043a',
    ],
    missing: ['\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u043d\u0430\u044f \u0432\u044b\u0434\u0430\u0447\u0430', '\u0412\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u043a\u0435\u0439\u0441\u043e\u0432'],
  },
  {
    id: 'pro',
    label: 'PRO',
    price: '4\u00a0990 \u20bd',
    sub: '\u0432 \u043c\u0435\u0441',
    icon: Zap,
    headerBg: 'bg-brand',
    headerText: 'text-black',
    cardBorder: 'border-brand',
    activeBorder: 'border-green-500',
    badge: '\u041f\u041e\u041f\u0423\u041b\u042f\u0420\u041d\u041e',
    badgeColor: 'bg-black text-white',
    ctaBg: 'bg-brand text-black',
    features: [
      '\u0411\u0435\u0437\u043b\u0438\u043c\u0438\u0442 \u043e\u0442\u043a\u043b\u0438\u043a\u043e\u0432',
      '\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u043d\u0430\u044f \u0432\u044b\u0434\u0430\u0447\u0430',
      '\u0412\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f \u043a\u0435\u0439\u0441\u043e\u0432',
      '\u0410\u0432\u0442\u043e\u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u043f\u043e \u0446\u0435\u043d\u0435',
      '\u0412\u0438\u0440\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u0435 \u0431\u0440\u0438\u0433\u0430\u0434\u044b',
      '\u041f\u043e\u043b\u043d\u0430\u044f \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430',
    ],
    missing: [],
  },
  {
    id: 'team',
    label: 'TEAM',
    price: '14\u00a0990 \u20bd',
    sub: '\u0432 \u043c\u0435\u0441',
    icon: Users,
    headerBg: 'bg-purple-600',
    headerText: 'text-white',
    cardBorder: 'border-purple-400',
    activeBorder: 'border-green-500',
    badge: '\u0411\u0420\u0418\u0413\u0410\u0414\u0410',
    badgeColor: 'bg-purple-600 text-white',
    ctaBg: 'bg-purple-600 text-white',
    features: [
      '\u0412\u0441\u0451 \u0438\u0437 Pro',
      '\u041c\u0443\u043b\u044c\u0442\u0438\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c',
      'CRM \u0434\u043b\u044f \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u0432',
      'AI-\u0441\u0431\u043e\u0440\u043a\u0430 \u0431\u0440\u0438\u0433\u0430\u0434\u044b',
      '\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u043e\u0431\u043e\u0440\u043e\u0442',
      'SLA-\u043a\u043e\u043d\u0442\u0440\u043e\u043b\u044c',
    ],
    missing: [],
  },
];

export default function SubscriptionPage() {
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await apiGet<{ plan?: string }>('/api/users/me');
      setCurrentPlan((me.plan ?? 'free').toLowerCase());
    } catch {
      setCurrentPlan('free');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setUpgrading(planId);
    try {
      await apiPost('/api/subscriptions/upgrade', { plan: planId });
      toast.success(`\u0422\u0430\u0440\u0438\u0444 ${planId.toUpperCase()} \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d!`);
      setCurrentPlan(planId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">

      {/* Sticky topbar */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> \u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f
        </Link>
        <div className="flex-1" />
        <CreditCard size={16} className="text-gray-400" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <CreditCard size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl md:text-3xl uppercase">\u041f\u043e\u0434\u043f\u0438\u0441\u043a\u0430</h1>
            <p className="text-xs font-bold text-gray-500">\u0422\u0430\u0440\u0438\u0444\u044b \u0438 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0438 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b</p>
          </div>
        </div>

        {/* Plan cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-96 border-2 border-black rounded-brutal animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const isActive = currentPlan === plan.id;
              const Icon = plan.icon;
              const border = isActive ? plan.activeBorder : plan.cardBorder;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col border-2 ${border} rounded-brutal overflow-hidden transition-all ${
                    isActive
                      ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top badge */}
                  {(plan.badge && !isActive) && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                      <span className={`px-3 py-0.5 text-[10px] font-black uppercase rounded-b-brutal border-b-2 border-x-2 border-black ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                      <span className="px-3 py-0.5 text-[10px] font-black uppercase rounded-b-brutal border-b-2 border-x-2 border-black bg-green-500 text-white">
                        \u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043f\u043b\u0430\u043d
                      </span>
                    </div>
                  )}

                  {/* Colour header */}
                  <div className={`${plan.headerBg} pt-9 pb-5 px-5 border-b-2 border-black`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={15} className={plan.headerText} />
                      <span className={`font-black text-xs uppercase tracking-widest ${plan.headerText}`}>{plan.label}</span>
                    </div>
                    <div className={`font-black text-3xl leading-none ${plan.headerText}`}>{plan.price}</div>
                    {plan.sub && <div className={`text-xs font-bold mt-1 opacity-70 ${plan.headerText}`}>{plan.sub}</div>}
                  </div>

                  {/* Features */}
                  <div className="flex-1 bg-surface-cardLight dark:bg-surface-cardDark px-4 py-4 space-y-2">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{f}</span>
                      </div>
                    ))}
                    {plan.missing.map((f, i) => (
                      <div key={`m${i}`} className="flex items-start gap-2">
                        <XIcon size={12} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-gray-300 dark:text-gray-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <div className="px-4 pb-5 bg-surface-cardLight dark:bg-surface-cardDark">
                    <button
                      disabled={isActive || upgrading === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full py-2.5 border-2 border-black rounded-brutal font-black text-xs uppercase transition-all ${
                        isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                          : `${plan.ctaBg} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px`
                      }`}
                    >
                      {isActive
                        ? '\u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043f\u043b\u0430\u043d'
                        : upgrading === plan.id
                          ? '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435...'
                          : `\u26a1 \u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 ${plan.label}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enterprise banner */}
        <div className="mt-5 border-2 border-black rounded-brutal overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Building2 size={26} className="text-brand shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-lg uppercase tracking-widest">Enterprise</span>
                  <span className="text-[10px] font-black uppercase bg-brand text-black px-2 py-0.5 rounded-brutal border border-black">\u0414\u0435\u0432\u0435\u043b\u043e\u043f\u0435\u0440\u044b</span>
                </div>
                <p className="text-xs font-bold text-gray-400">
                  White-label \u043a\u0430\u0431\u0438\u043d\u0435\u0442 \u00b7 API \u00b7 \u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u044b\u0439 SLA \u00b7 \u041c\u0430\u0441\u0441\u043e\u0432\u044b\u0439 \u043f\u043e\u0434\u0431\u043e\u0440 \u00b7 \u0410\u043a\u043a\u0430\u0443\u043d\u0442-\u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <span className="font-black text-2xl">79\u00a0000+ \u20bd<span className="text-sm font-bold text-gray-400"> /\u043c\u0435\u0441</span></span>
              <a
                href="mailto:hello@stroik.ru?subject=Enterprise"
                className="inline-flex items-center gap-2 bg-brand text-black border-2 border-brand font-black text-xs uppercase px-4 py-2 rounded-brutal hover:bg-yellow-400 transition-colors"
              >
                <Mail size={13} /> \u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold text-gray-400 text-center">
          \u041e\u043f\u043b\u0430\u0442\u0430 \u043a\u0430\u0440\u0442\u043e\u0439 \u0438\u043b\u0438 \u0421\u0411\u041f \u00b7 \u0410\u0432\u0442\u043e\u043f\u0440\u043e\u0434\u043b\u0435\u043d\u0438\u0435 \u0432 \u043e\u0434\u0438\u043d \u043a\u043b\u0438\u043a \u00b7 \u041e\u0442\u043c\u0435\u043d\u0430 \u0432 \u043b\u044e\u0431\u043e\u0439 \u043c\u043e\u043c\u0435\u043d\u0442
        </p>
      </div>
    </div>
  );
}
