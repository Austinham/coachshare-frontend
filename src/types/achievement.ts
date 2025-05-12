import { LucideIcon } from 'lucide-react';

export interface Achievement {
  id: string; // Unique identifier for the achievement type (e.g., 'first-workout', 'milestone-10')
  title: string;
  description: string;
  iconName: string; // Store the icon name (e.g., 'Award', 'Star') instead of the component itself
  achieved: boolean; // Whether the user has earned this achievement
  achievedDate?: string | Date; // Optional: When the achievement was earned
} 