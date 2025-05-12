import { RegimenType } from '@/types/regimen';

interface Day {
  id: string;
  name: string;
  date: string;
  intensity: string;
  exercises: any[];
}

export interface IntensityProfile {
  easy: number;
  medium: number;
  hard: number;
  rest: number;
  custom: Record<string, number>; // For any custom intensity levels
}

/**
 * Calculate intensity breakdown for a program
 */
export const calculateIntensityProfile = (program: RegimenType): IntensityProfile => {
  const profile: IntensityProfile = {
    easy: 0,
    medium: 0,
    hard: 0,
    rest: 0,
    custom: {}
  };
  
  // Skip if program has no days
  if (!program.days || !Array.isArray(program.days)) {
    return profile;
  }
  
  program.days.forEach(day => {
    // Handle case where intensity might be null or undefined
    if (!day.intensity) {
      return;
    }
    
    // Normalize intensity value - strict matching with exact intensity levels
    const intensityValue = day.intensity.toLowerCase().trim();
    
    // Exact matching for standard intensity levels
    if (intensityValue === 'easy') {
      profile.easy += 1;
    } else if (intensityValue === 'medium') {
      profile.medium += 1;
    } else if (intensityValue === 'hard') {
      profile.hard += 1;
    } else if (intensityValue === 'rest') {
      profile.rest += 1;
    } else {
      // For any other value, store in custom
      if (!profile.custom[intensityValue]) {
        profile.custom[intensityValue] = 0;
      }
      profile.custom[intensityValue] += 1;
    }
  });
  
  return profile;
};

/**
 * Determine overall intensity based on the profile
 */
export const determineOverallIntensity = (profile: IntensityProfile): string => {
  // Get the total number of days
  const total = profile.easy + profile.medium + profile.hard + profile.rest + 
                Object.values(profile.custom).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) return 'Unknown';
  
  // Calculate percentages
  const easyPercentage = profile.easy / total;
  const mediumPercentage = profile.medium / total;
  const hardPercentage = profile.hard / total;
  const restPercentage = profile.rest / total;
  
  // Determine overall intensity with more precise thresholds
  if (hardPercentage >= 0.5) {
    return 'Hard';
  } else if (mediumPercentage >= 0.5) {
    return 'Medium';
  } else if (easyPercentage >= 0.5) {
    return 'Easy';
  } else if (restPercentage >= 0.5) {
    return 'Rest';
  } else if (hardPercentage >= 0.33) {
    return 'Hard';
  } else if (mediumPercentage >= 0.33) {
    return 'Medium';
  } else if (easyPercentage >= 0.33) {
    return 'Easy';
  } else if (restPercentage >= 0.33) {
    return 'Rest';
  } else {
    // For mixed intensities with no clear majority
    const max = Math.max(hardPercentage, mediumPercentage, easyPercentage, restPercentage);
    if (max === hardPercentage) return 'Hard';
    if (max === mediumPercentage) return 'Medium';
    if (max === easyPercentage) return 'Easy';
    if (max === restPercentage) return 'Rest';
    return 'Medium'; // Default fallback
  }
};

/**
 * Get intensity color for UI elements
 */
export const getIntensityColor = (intensity: string): string => {
  const intensityLower = intensity.toLowerCase();
  
  switch (intensityLower) {
    case 'easy':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'hard':
      return 'red';
    case 'rest':
      return 'blue';
    default:
      return 'gray';
  }
};

/**
 * Get TailwindCSS color classes for intensity levels
 */
export const getIntensityColorClasses = (intensity: string): {bg: string, text: string, border: string} => {
  const intensityLower = intensity.toLowerCase();
  
  switch (intensityLower) {
    case 'easy':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-500'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-500'
      };
    case 'hard':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-500'
      };
    case 'rest':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-500'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300'
      };
  }
};

export function getOverallIntensity(days: Day[]): string {
  if (!days || days.length === 0) return 'Unknown';

  const intensityCounts = days.reduce((acc, day) => {
    const intensity = day.intensity.toLowerCase();
    acc[intensity] = (acc[intensity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDays = days.length;
  const easyPercentage = (intensityCounts['easy'] || 0) / totalDays;
  const mediumPercentage = (intensityCounts['medium'] || 0) / totalDays;
  const hardPercentage = (intensityCounts['hard'] || 0) / totalDays;
  const restPercentage = (intensityCounts['rest'] || 0) / totalDays;

  if (restPercentage > 0.5) return 'Rest';
  if (easyPercentage > 0.5) return 'Easy';
  if (mediumPercentage > 0.5) return 'Medium';
  if (hardPercentage > 0.5) return 'Hard';
  if (easyPercentage + mediumPercentage > 0.5) return 'Easy-Medium';
  if (mediumPercentage + hardPercentage > 0.5) return 'Medium-Hard';
  if (easyPercentage + hardPercentage > 0.5) return 'Mixed';
  return 'Balanced';
} 