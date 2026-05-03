import { useState, useEffect, useCallback } from 'react';

export interface BlockDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  defaultVisible: boolean;
  roles: ('worker' | 'employer' | 'all')[];
}

// Полный каталог блоков платформы
export const ALL_BLOCKS: BlockDef[] = [
  {
    id: 'stats',
    label: 'Статистика',
    icon: 'BarChart3',
    description: 'Просмотры, отклики, конверсия',
    defaultVisible: true,
    roles: ['all'],
  },
  {
    id: 'bids',
    label: 'Мои отклики',
    icon: 'SendHorizonal',
    description: 'Статусы поданных заявок',
    defaultVisible: true,
    roles: ['worker'],
  },
  {
    id: 'projects',
    label: 'Мои объекты',
    icon: 'Layers',
    description: 'Активные проекты и заявки',
    defaultVisible: true,
    roles: ['employer'],
  },
  {
    id: 'feed',
    label: 'Лента заказов',
    icon: 'Rss',
    description: 'Новые доступные заказы',
    defaultVisible: true,
    roles: ['worker'],
  },
  {
    id: 'portfolio',
    label: 'Портфолио',
    icon: 'Image',
    description: 'Кейсы и выполненные работы',
    defaultVisible: true,
    roles: ['worker'],
  },
  {
    id: 'verification',
    label: 'Верификация',
    icon: 'ShieldCheck',
    description: 'Уровень доверия и документы',
    defaultVisible: true,
    roles: ['all'],
  },
  {
    id: 'subscription',
    label: 'Подписка',
    icon: 'CreditCard',
    description: 'Тариф, лимиты и апгрейд',
    defaultVisible: false,
    roles: ['all'],
  },
  {
    id: 'leads',
    label: 'Лиды',
    icon: 'Zap',
    description: 'Купленные заявки от заказчиков',
    defaultVisible: false,
    roles: ['worker'],
  },
  {
    id: 'team',
    label: 'Бригада',
    icon: 'Users',
    description: 'Состав и управление бригадой',
    defaultVisible: false,
    roles: ['worker'],
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    icon: 'TrendingUp',
    description: 'Доходы, средний чек, динамика',
    defaultVisible: false,
    roles: ['all'],
  },
  {
    id: 'escrow',
    label: 'Безопасная сделка',
    icon: 'Lock',
    description: 'Эскроу и выплаты',
    defaultVisible: false,
    roles: ['all'],
  },
  {
    id: 'reviews',
    label: 'Отзывы',
    icon: 'Star',
    description: 'Рейтинг и отзывы по договорам',
    defaultVisible: false,
    roles: ['worker'],
  },
];

const STORAGE_KEY = (role: string) => `stroik_blocks_${role}`;

export function useDashboardBlocks(role: 'worker' | 'employer') {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const availableBlocks = ALL_BLOCKS.filter(
    (b) => b.roles.includes('all') || b.roles.includes(role)
  );

  useEffect(() => {
    const key = STORAGE_KEY(role);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        // Filter to only IDs that still exist
        const valid = parsed.filter((id) => availableBlocks.some((b) => b.id === id));
        setVisibleIds(valid);
      } catch {
        setVisibleIds(availableBlocks.filter((b) => b.defaultVisible).map((b) => b.id));
      }
    } else {
      setVisibleIds(availableBlocks.filter((b) => b.defaultVisible).map((b) => b.id));
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const toggleBlock = useCallback(
    (id: string) => {
      setVisibleIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem(STORAGE_KEY(role), JSON.stringify(next));
        return next;
      });
    },
    [role]
  );

  const isVisible = useCallback((id: string) => visibleIds.includes(id), [visibleIds]);

  return { availableBlocks, visibleIds, toggleBlock, isVisible, initialized };
}
