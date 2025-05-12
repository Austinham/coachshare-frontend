import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows cookies to be sent with requests
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request');
    } else {
      console.log('No auth token available for request');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Store token if it exists in response
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      console.log('Token stored from response');
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Add a retry mechanism for getCurrentUser
const withRetry = async (fn: () => Promise<any>, retries = 2, delay = 500) => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || (error.response && error.response.status !== 429)) {
      throw error;
    }
    
    console.log(`Request failed due to rate limiting, retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

// Try to get token from storage
const getStoredToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

// Add a simple in-memory cache
let userCache: any = null;
let lastFetchTime = 0;
let authCheckFailure = false;
const CACHE_DURATION = 60000; // 1 minute
const FAILURE_CACHE_DURATION = 10000; // 10 seconds cache for failures

// Function to clear user cache
export const clearUserCache = () => {
  userCache = null;
  lastFetchTime = 0;
  authCheckFailure = false;
};

// Authentication services
export const authService = {
  // Register a new user
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'coach' | 'athlete';
  }) => {
    console.log('Sending registration request for:', userData.email);
    try {
      const response = await api.post('/auth/register', userData);
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Log in a user
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Sending login request for:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      console.log('Login response received:', response.data);
      
      // Store token if it exists
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Get current user failed:', error);
      throw error;
    }
  },

  // Log out user
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error: any) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    clearUserCache(); // Clear cache before updating profile
    const response = await api.patch('/auth/update-me', userData);
    return response.data;
  },

  // Update password
  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.patch('/auth/update-password', passwordData);
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token: string, password: string) => {
    const response = await api.patch(`/auth/reset-password/${token}`, {
      password
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/auth/delete-account');
    return response.data;
  },

  // Add this function
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token', {}, {
        withCredentials: true
      });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },
};

// Add a synchronous check for token at app startup
export const hasAuthToken = () => {
  try {
    return !!localStorage.getItem('token');
  } catch (e) {
    console.error('Error checking localStorage for token:', e);
    return false;
  }
};

// Add token refresh functionality
export const refreshToken = async () => {
  try {
    // Only try to refresh if we have a token
    if (!hasAuthToken()) return false;
    
    const response = await api.post('/auth/refresh-token', {}, {
      withCredentials: true,
    });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return false;
  }
};

export default api; 