export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'coach' | 'athlete' | 'admin';
  isEmailVerified: boolean;
  coachId?: string;
  athletes?: string[];
  // Coach profile fields
  bio?: string;
  experience?: string;
  specialties?: string[];
  qualifications?: Array<{
    title: string;
    institution?: string;
    year?: string;
  }>;
  avatarUrl?: string;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  // Athlete fields
  height?: number;
  weight?: number;
  birthdate?: Date;
  sport?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  regimens?: string[];
} 