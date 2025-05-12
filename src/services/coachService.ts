import axios from 'axios';
import api from '@/lib/api';
// Remove the import of CoachProps since we're defining it locally
// import { CoachProps } from '@/components/CoachCard';

// Define CoachProps locally
export interface CoachProps {
  _id: string;
  firstName: string;
  lastName: string;
  specialties?: string[];
  bio?: string;
  experience?: string;
  rating?: number;
  reviews?: number;
  avatarUrl?: string;
  createdAt?: string;
  startDate?: string;
  qualifications?: Array<{
    title: string;
    institution?: string;
    year?: string;
  }>;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
}

const API_URL = 'http://localhost:8000';

/**
 * Fetch all available coaches
 */
export const getCoaches = async (): Promise<CoachProps[]> => {
  try {
    const response = await fetch('/api/coaches');
    if (!response.ok) {
      throw new Error('Failed to fetch coaches');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching coaches:', error);
    throw error;
  }
};

/**
 * Fetch all coaches for the athlete
 */
export const getMyCoaches = async (): Promise<CoachProps[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/my-coaches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching coaches:', response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('Coaches data received:', data);

    if (!data.data?.coaches || !Array.isArray(data.data.coaches)) {
      return [];
    }

    return data.data.coaches.map((coach: any) => ({
      _id: coach.id || coach._id,
      firstName: coach.firstName || '',
      lastName: coach.lastName || '',
      specialties: Array.isArray(coach.specialties) ? coach.specialties : [],
      bio: coach.bio || '',
      experience: coach.experience || '',
      qualifications: Array.isArray(coach.qualifications) ? coach.qualifications : [],
      avatarUrl: coach.avatarUrl || '',
      socialLinks: coach.socialLinks || {},
      isPrimary: !!coach.isPrimary
    }));
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return [];
  }
};

/**
 * Fetch the current athlete's coach
 */
export const getMyCoach = async (): Promise<CoachProps | null> => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/my-coach', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching coach:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Coach data received:', data);

    if (!data.data?.coach) {
      return null;
    }

    const coach = data.data.coach;
    return {
      _id: coach.id || coach._id,
      firstName: coach.firstName || '',
      lastName: coach.lastName || '',
      specialties: Array.isArray(coach.specialties) ? coach.specialties : [],
      bio: coach.bio || '',
      experience: coach.experience || '',
      qualifications: Array.isArray(coach.qualifications) ? coach.qualifications : [],
      avatarUrl: coach.avatarUrl || '',
      socialLinks: coach.socialLinks || {}
    };
  } catch (error) {
    console.error('Error fetching coach:', error);
    return null;
  }
};

/**
 * Fetch the athlete's coach history
 */
export const getCoachHistory = async (): Promise<CoachProps[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/auth/coach-history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching coach history:', response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('Coach history data received:', data);

    const coaches = data.data?.coaches || [];
    
    return coaches.map(coach => ({
      _id: coach._id,
      firstName: coach.firstName,
      lastName: coach.lastName,
      specialties: coach.specialties || [],
      bio: coach.bio || '',
      experience: coach.experience || '',
      rating: coach.rating,
      reviews: coach.reviews,
      avatarUrl: coach.avatarUrl,
      createdAt: coach.createdAt,
      startDate: coach.startDate || coach.createdAt,
      qualifications: coach.qualifications || []
    }));
  } catch (error) {
    console.error('Error fetching coach history:', error);
    return [];
  }
};

/**
 * Send a request to connect with a coach
 */
export const requestCoachConnection = async (coachId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/request-coach`, { coachId });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error: any) {
    console.error('Error connecting with coach:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to connect with coach. Please try again.'
    };
  }
}; 