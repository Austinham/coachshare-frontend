import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Define the user type
export interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'coach' | 'athlete';
  isEmailVerified: boolean;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, role: 'coach' | 'athlete') => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  verifyEmail: async () => {},
  resendVerification: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
  deleteAccount: async () => {}
};

// Create the context
export const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only make the API call if we don't already have a user
        if (!user) {
          const response = await authService.getCurrentUser();
          if (response && response.data && response.data.user) {
            const userData = response.data.user;
            setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              isEmailVerified: userData.isEmailVerified
            });
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Don't set any state on error, just continue as unauthenticated
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);  // Only run this effect once when the component mounts

  // Register new user
  const register = async (firstName: string, lastName: string, email: string, password: string, role: 'coach' | 'athlete') => {
    setLoading(true);
    try {
      const response = await authService.register({ firstName, lastName, email, password, role });
      console.log("Auth context registration response:", response);
      
      // Check for verification token in development
      if (response && response.verificationToken) {
        console.log("Auth context sending verification email to", email, "with token", response.verificationToken);
      }
      
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/verify-email?email=' + encodeURIComponent(email));
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.data.user);
      toast.success('Logged in successfully');
      navigate('/app');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Invalid credentials');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token: string) => {
    setLoading(true);
    try {
      await authService.verifyEmail(token);
      toast.success('Email verified successfully! You can now log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast.error(error.response?.data?.message || 'Email verification failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async (email: string) => {
    setLoading(true);
    try {
      await authService.resendVerification(email);
      toast.success('Verification email sent successfully!');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend verification email. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(data);
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully!');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update password. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.deleteAccount();
      setUser(null);
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Values to provide
  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword: async () => {},
    resetPassword: async () => {},
    updateProfile,
    updatePassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 