import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет CSS классы и разрешает конфликты Tailwind (например, p-4 и p-2).
 * @param inputs - Массив классов, объектов или условных выражений.
 * @returns Строка с итоговыми классами.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
