import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import { authService } from '@/lib/api';

// Define the user type
interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'athlete' | 'coach' | 'admin';
  isEmailVerified: boolean;
  coaches?: any[];
  primaryCoachId?: string;
  coachId?: string | null; // Add coachId field for athletes
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
}

// Define the expected response type for the register function
interface RegisterResponse {
  isExistingUser?: boolean;
  verificationToken?: string; // Assuming this might also be part of the response
  // Add other properties from the actual API response if known
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<RegisterResponse | void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Define props for AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

// Default context with empty implementations
const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => { return undefined; },
  verifyEmail: async () => {},
  resendVerification: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  deleteAccount: async () => {}
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check localStorage for token first
        const hasToken = localStorage.getItem('token');
        console.log('AuthContext: Found token in storage:', !!hasToken);
        
        // Try to refresh the token if it exists
        if (hasToken) {
          try {
            const refreshResult = await authService.refreshToken();
            console.log('Token refresh result:', refreshResult?.status === 'success' ? 'success' : 'failed');
            
            // If refresh was successful and user data is included
            if (refreshResult?.status === 'success' && refreshResult?.data?.user) {
              const userData = refreshResult.data.user;
              setCurrentUser({
                ...userData,
                _id: userData._id,
                id: userData.id || userData._id,
                name: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                isEmailVerified: userData.isEmailVerified,
                coaches: userData.coaches,
                primaryCoachId: userData.primaryCoachId,
                athletes: userData.athletes,
                bio: userData.bio,
                experience: userData.experience,
                specialties: userData.specialties,
                qualifications: userData.qualifications,
                avatarUrl: userData.avatarUrl,
                socialLinks: userData.socialLinks
              });
              setIsAuthenticated(true);
              setLoading(false);
              return; // Exit early if refresh succeeded
            }
          } catch (err) {
            console.warn('Token refresh failed, will try regular auth check');
            // Continue to regular auth check if refresh failed
          }
        }
        
        // Make API call to check authentication
        const response = await api.get('/auth/me');
        
        if (response?.data?.data?.user) {
          const userData = response.data.data.user;
          setCurrentUser({
            ...userData,
            _id: userData._id,
            id: userData.id || userData._id,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            isEmailVerified: userData.isEmailVerified,
            coaches: userData.coaches,
            primaryCoachId: userData.primaryCoachId,
            athletes: userData.athletes,
            bio: userData.bio,
            experience: userData.experience,
            specialties: userData.specialties,
            qualifications: userData.qualifications,
            avatarUrl: userData.avatarUrl,
            socialLinks: userData.socialLinks
          });
          setIsAuthenticated(true);
          
          // Ensure we have a token stored
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          // Clear token if authentication failed
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        // Clear token on error
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data.data;

      console.log('Login response:', response.data);
      console.log('Login successful, token exists:', !!token);
      
      // Store token in localStorage
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage successfully');
      } else {
        console.error('No token received from login response');
        throw new Error('No token received from server');
      }

      // Set user data
      setCurrentUser({
        ...userData,
        _id: userData._id,
        id: userData.id || userData._id,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified,
        coaches: userData.coaches,
        primaryCoachId: userData.primaryCoachId,
        athletes: userData.athletes,
        bio: userData.bio,
        experience: userData.experience,
        specialties: userData.specialties,
        qualifications: userData.qualifications,
        avatarUrl: userData.avatarUrl,
        socialLinks: userData.socialLinks
      });
      setIsAuthenticated(true);

      // Redirect based on role
      if (userData.role === 'coach') {
        navigate('/app');
      } else if (userData.role === 'athlete') {
        navigate('/app');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const register = async (userData: any): Promise<RegisterResponse | void> => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      
      // Check if verification token is returned (for development)
      if (response.data && response.data.verificationToken) {
        console.log('Verification token received:', response.data.verificationToken);
        navigate(`/verify-email?token=${response.data.verificationToken}`);
      } else {
        // In production, redirect to waiting page
        navigate(`/verify-email?email=${encodeURIComponent(userData.email)}`);
      }
      return response.data as RegisterResponse; // Return the response data
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error; // Re-throw the error to be caught by the caller if needed
    }
  };

  const verifyEmail = async (token: string) => {
    // Implementation of verifyEmail function
  };

  const resendVerification = async () => {
    // Implementation of resendVerification function
  };

  const forgotPassword = async (email: string) => {
    // Implementation of forgotPassword function
  };

  const resetPassword = async (token: string, password: string) => {
    // Implementation of resetPassword function
  };

  const updateProfile = async (data: any) => {
    try {
      setError(null);
      
      // Call the API to update the user's profile
      const response = await api.patch('/auth/update-me', data);
      
      if (response.data && response.data.data && response.data.data.user) {
        // Update the current user state with the updated data
        const updatedUser = response.data.data.user;
        setCurrentUser(prevUser => ({
          ...prevUser!,
          ...updatedUser,
          firstName: updatedUser.firstName || prevUser?.firstName,
          lastName: updatedUser.lastName || prevUser?.lastName,
          name: `${updatedUser.firstName || prevUser?.firstName} ${updatedUser.lastName || prevUser?.lastName}`,
        }));
        
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      await api.delete('/auth/delete-account');
      // Clear local storage and state
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete account. Please try again.');
      throw error;
    }
  };

  const value = {
    user: currentUser,
    isAuthenticated,
    isLoading: loading,
    error,
    login,
    logout,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    deleteAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 