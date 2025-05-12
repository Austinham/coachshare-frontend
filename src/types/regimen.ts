// Regimen types

export type IntensityLevel = 'Easy' | 'Medium' | 'Hard' | 'Rest' | string;

export interface ExerciseType {
  id: string;
  _id?: string;  // MongoDB ObjectId
  name: string;
  sets: number;
  isReps: boolean;
  reps: number;
  duration: string;
  distance: string; // For distance-based exercises (e.g., "30m", "400m")
  restInterval: string;
  notes: string;
  mediaLinks: string[];
  perSide: boolean; // Indicates if the exercise is performed per side (each leg/arm)
}

export interface RegimenDayType {
  id: string;
  _id?: string;  // MongoDB ObjectId
  date: string;
  name: string;
  intensity: IntensityLevel;
  exercises: ExerciseType[];
}

export interface RegimenType {
  id: string;
  _id?: string;  // MongoDB ObjectId
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  days: RegimenDayType[];
  createdAt: string;
  updatedAt: string;
  category: string; // Category to help organize and find regimens
  sport?: string;   // Sports/tags (comma-separated list)
  level?: string;   // Difficulty level (Beginner, Intermediate, Advanced)
  customIntensities?: string[]; // Custom intensity levels created by user
}

// New structure for intensity-based layout
export interface RegimenColumnsType {
  Easy: RegimenDayType[];
  Medium: RegimenDayType[];
  Hard: RegimenDayType[];
  Rest: RegimenDayType[];
  [key: string]: RegimenDayType[]; // For custom intensity levels
}

// Helper function to convert array of days to intensity-based columns
export function daysToColumns(days: RegimenDayType[]): RegimenColumnsType {
  const columns: RegimenColumnsType = {
    Easy: [],
    Medium: [],
    Hard: [],
    Rest: []
  };

  days.forEach(day => {
    if (!columns[day.intensity]) {
      columns[day.intensity] = [];
    }
    columns[day.intensity].push(day);
  });

  return columns;
}

// Helper function to convert columns back to array of days
export function columnsToDays(columns: RegimenColumnsType): RegimenDayType[] {
  let days: RegimenDayType[] = [];
  
  Object.keys(columns).forEach(intensity => {
    days = [...days, ...columns[intensity]];
  });
  
  // Sort by date
  days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return days;
}

export interface TrainingDayType {
  id: string;
  name: string;
  date: string;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps?: number;
    isReps: boolean;
    duration?: string;
    restInterval?: string;
    notes?: string;
    mediaLinks: string[];
  }[];
}

// Add these types at the end of the file

export type TrainingPeriodType = 'easy' | 'medium' | 'hard' | 'rest';

export interface ExerciseBlockType {
  id: string;
  name: string;
  sets: number;
  isReps: boolean;
  reps?: number;
  duration?: string;
  restInterval?: string;
  notes?: string;
  mediaLinks: string[];
}
