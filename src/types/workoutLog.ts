// src/types/workoutLog.ts

import { User } from './user';

// Define ExerciseLog first as it's nested
export interface ExerciseLog {
    id?: string; // May not always have frontend ID
    _id?: string; // Backend ID
    exerciseId: string;
    exerciseName: string;
    sets: number;
    targetReps?: number; // Target might be optional
    actualReps?: number; // Actual might be optional until logged
    weight?: string; // Use string to accommodate units like 'kg'
    notes?: string;
    completed?: boolean; // Optional until logged
    completedAt?: string | Date; // Date might be better
}

// Define WorkoutLog
export interface WorkoutLog {
    id?: string; // May not always have frontend ID
    _id: string; // Backend ID is usually present
    regimenId: string;
    regimenName?: string; // Denormalized, might not always be present
    dayId: string;
    dayName?: string; // Denormalized
    athleteId: string | { // Can be populated or just ID
        _id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string; // Include avatar if populated
    };
    athleteName?: string; // Often added during processing
    athleteProfilePic?: string; // Often added during processing
    rating?: number; // Optional until logged
    notes?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Very Hard'; // Use enum if preferred
    completed: boolean;
    completedAt?: string | Date; // Use Date for easier manipulation
    duration?: number; // In minutes, optional until logged
    exercises: ExerciseLog[];
    sharedWith?: (string | User)[]; // Array of User IDs or populated User objects
    isDirectlyCoached?: boolean; // Flag added during processing
    createdAt?: string | Date;
    updatedAt?: string | Date;
    intensity?: string; // Add the missing intensity field
} 