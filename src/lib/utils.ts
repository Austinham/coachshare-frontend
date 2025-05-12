import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOverallIntensity(days: { intensity: string }[]): number {
  const intensityValues = {
    'Easy': 25,
    'Medium': 50,
    'Hard': 75,
    'Rest': 0
  };

  if (!days || days.length === 0) return 0;

  const totalIntensity = days.reduce((sum, day) => {
    return sum + (intensityValues[day.intensity] || 0);
  }, 0);

  return Math.round(totalIntensity / days.length);
}
