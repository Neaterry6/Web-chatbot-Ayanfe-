import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to a readable string
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a delay function for staggered animations
 */
export function staggerDelay(index: number, baseDelay = 0.1): number {
  return baseDelay * index;
}

/**
 * Create an easy to use animation sequence
 */
export function animationSequence(
  elements: { id: string; delay?: number }[],
  baseDelay = 0.15
): Record<string, number> {
  return elements.reduce((acc, el, index) => {
    acc[el.id] = el.delay !== undefined ? el.delay : baseDelay * index;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Truncate text
 */
export function truncateText(text: string, length = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate random ID for animation keys
 */
export function generateId(length = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}