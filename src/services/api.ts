import { toast } from "sonner";
import axios from 'axios';
import { Achievement } from '@/types/achievement'; // Import Achievement type
import { WorkoutLog } from '@/types/workoutLog'; // Add this import

// API base URL - use a single consistent URL
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://coachshare-api.vercel.app/api'  // Production API URL
  : 'http://localhost:8000/api';  // Development API URL

// Request deduplication system
const pendingRequests = new Map();
const recentResponses = new Map();

const dedupRequest = async (endpoint, requestFn) => {
  // Check if we already have a recent response (within 5 seconds)
  const cacheKey = endpoint;
  const cachedResponse = recentResponses.get(cacheKey);
  const now = Date.now();
  
  if (cachedResponse && (now - cachedResponse.timestamp < 5000)) {
    console.log(`Using cached response for ${endpoint} (${((now - cachedResponse.timestamp)/1000).toFixed(1)}s old)`);
    return cachedResponse.data;
  }
  
  // Check if this exact request is already in progress
  if (pendingRequests.has(cacheKey)) {
    console.log(`Request to ${endpoint} already in progress, waiting for result`);
    return pendingRequests.get(cacheKey);
  }
  
  // Create a new request promise
  const requestPromise = (async () => {
    try {
      const result = await requestFn();
      // Cache the result
      recentResponses.set(cacheKey, { 
        data: result, 
        timestamp: Date.now() 
      });
      return result;
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the promise
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// Helper function to safely extract ID from user object
const extractUserId = (user: any): string => {
  if (!user) return '';
  if (typeof user._id === 'string') return user._id;
  if (typeof user.id === 'string') return user.id;
  return '';
};

// Generic error handler
const handleError = (error: any) => {
  console.error('API Error:', error);
  if (error.response) {
    console.error('Error response:', error.response.data);
  }
  throw error;
};

// Type-safe fetch wrapper with caching ability
export async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {},
  errorMessage: string = "An error occurred while fetching data"
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get authentication token
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: 'include', // Always include credentials
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return handleError(error);
  }
}

// Regimen API functions
export const regimensApi = {
  getAll: () => 
    fetchApi<any[]>('/regimens', {}, 'Failed to fetch regimens'),
  
  getByCategory: (category: string) => 
    fetchApi<any[]>(`/regimens/category/${category}`, {}, `Failed to fetch ${category} regimens`),
  
  getById: (id: string) => 
    fetchApi<any>(`/regimens/${id}`, {}, 'Failed to fetch regimen details'),
  
  getRecent: (limit: number = 3) => 
    fetchApi<any[]>(`/regimens?limit=${limit}`, {}, 'Failed to fetch recent regimens'),
  
  create: (regimenData: any) => 
    fetchApi<any>('/regimens', {
      method: 'POST',
      body: JSON.stringify(regimenData),
    }, 'Failed to create regimen'),
  
  update: (id: string, regimenData: any) => 
    fetchApi<any>(`/regimens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(regimenData),
    }, 'Failed to update regimen'),
  
  delete: (id: string) => 
    fetchApi<void>(`/regimens/${id}`, {
      method: 'DELETE',
    }, 'Failed to delete regimen'),
};

// Athletic API functions
export const athletesApi = {
  // Add athlete-related API functions here
};

// Create an axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include authentication token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      // Handle CORS errors specifically
      if (error.response.status === 0) {
        toast.error('Network error: Unable to connect to the server');
      }
    }
    return Promise.reject(error);
  }
);

// Add workout logs cache
let workoutLogsCache = {
  data: null,
  timestamp: 0,
  ttl: 60000 // 1 minute cache TTL
};

// Add this helper function for authenticated calls

// Helper function to make authenticated API calls with deduplication
const authenticatedApiCall = async (endpoint, apiCallFn) => {
  return dedupRequest(endpoint, async () => {
    // Check authentication status once and cache it
    const authStatus = await dedupRequest('/auth/check', async () => {
      try {
        const authCheck = await api.get('/auth/check');
        return authCheck?.data?.authenticated === true;
      } catch (error) {
        console.error('Auth check failed:', error);
        return false;
      }
    });
    
    if (!authStatus) {
      console.error('User is not authenticated');
      toast.error('Please log in to access this feature');
      return [];
    }
    
    // User is authenticated, proceed with the API call
    return apiCallFn();
  });
};

// Define a type for basic user info
interface BasicUserInfo {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

// User Service (Example - Create or add to existing if needed)
export const userService = {
    // Function to get details for multiple users by ID
    getUsersByIds: async (ids: string[]): Promise<BasicUserInfo[]> => {
        if (!ids || ids.length === 0) {
            return [];
        }
        // Construct the query string
        const idsQuery = ids.join(',');
        try {
            // Call the new /users/batch endpoint (no /api/ prefix)
            const response = await api.get<{ status: string, data: BasicUserInfo[] }>(`/users/batch?ids=${idsQuery}`);
            if (response.data && response.data.status === 'success') {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching batch user details:', error);
            toast.error("Failed to fetch coach details.");
            return [];
        }
    }
    // ... other user service functions ...
};

// Export service functions
export const regimenService = {
  // For debugging only - get raw regimens without filtering
  getRawRegimens: async () => {
    try {
      const response = await api.get('/regimens');
      return response?.data?.data || response?.data || [];
    } catch (error) {
      console.error('Error fetching raw regimens:', error);
      toast.error('Failed to fetch regimens. Please check if the server is running.');
      return [];
    }
  },
  
  // Direct server test function
  testServerConnection: async () => {
    try {
      const response = await api.get('/health');
      return response?.status === 200;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  },

  // Function to fetch all regimens (filtered by role on backend)
  getAllRegimens: async (): Promise<any[]> => {
    try {
      // Assuming the backend filters by coach automatically based on auth
      const response = await api.get<any>('/regimens/coach'); 
      
      // Correctly extract the nested array
      const data = response.data?.data?.regimens;
      
      if (Array.isArray(data)) {
        console.log(`Fetched ${data.length} regimens for list`);
        return data;
      } else {
        console.warn('[getAllRegimens] Expected an array in response.data.data.regimens, but received:', response.data);
        return []; // Return empty array if structure is wrong or data is not array
      }
    } catch (error: any) {
      console.error('Error fetching all regimens:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch regimens.';
      toast.error(errorMessage);
      return [];
    }
  },

  // Get regimens assigned to the logged-in athlete
  getAthleteRegimens: async () => {
    try {
      const response = await api.get('/regimens/athlete');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching athlete regimens:', error);
      toast.error('Failed to fetch athlete regimens. Please check if the server is running.');
      throw error;
    }
  },

  // Get a single regimen by ID
  getRegimenById: async (id: string) => {
    try {
      console.log(`Fetching regimen ${id}`);
      const response = await api.get(`/regimens/${id}`); // Uses the axios instance 'api'

      // Ensure data is returned correctly nested
      if (response.data && response.data.status === 'success' && response.data.data?.regimen) {
        const regimenData = response.data.data.regimen;

        // <<< FIX: Ensure 'id' field exists >>>
        if (!regimenData.id && regimenData._id) {
          console.warn("Regimen data from API missing 'id', adding it from '_id'.");
          regimenData.id = regimenData._id.toString(); // Use _id if id is missing
        }

        // Double-check if 'id' is now present
        if (!regimenData.id) {
           console.error("Critical Error: Regimen data still missing 'id' field after check:", regimenData);
           toast.error('Received invalid regimen data from server.');
           return null;
        }

        console.log("getRegimenById returning:", regimenData);
        return regimenData; // Return the potentially modified data
      } else {
        console.warn(`Unexpected response structure for getRegimenById ${id}:`, response.data);
        toast.error('Failed to retrieve regimen details.');
        return null; // Or throw an error
      }
    } catch (error) {
      console.error(`Error fetching regimen ${id}:`, error);
      if (error.response && error.response.status === 404) {
        toast.error('Regimen not found.');
      } else {
        toast.error('Failed to fetch regimen details. Please try again.');
      }
      return null;
    }
  },

  // Create a new regimen (coach only)
  createRegimen: async (regimenData: any) => {
    try {
      console.log('Creating regimen with data:', { 
        name: regimenData.name,
        category: regimenData.category
      });
      
      // Check for token to prevent obvious auth errors
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token available');
        toast.error('Please log in to create a regimen');
        throw new Error('Authentication token not available');
      }
      
      const response = await api.post('/regimens', regimenData);
      const createdRegimen = response.data.data || response.data;
      
      console.log('Regimen created successfully:', { 
        id: createdRegimen._id || createdRegimen.id,
        name: createdRegimen.name
      });
      
      return createdRegimen;
    } catch (error) {
      console.error('Error creating regimen:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Server responded with error:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Handle specific error codes
        if (error.response.status === 401) {
          toast.error('You must be logged in to create a regimen');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to create regimens');
        } else if (error.response.status === 400) {
          toast.error('Invalid regimen data. Please check all required fields.');
        } else {
          toast.error('Failed to create regimen. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('Server not responding. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        toast.error('An error occurred. Please try again.');
      }
      
      throw error;
    }
  },

  // Update an existing regimen (coach only)
  updateRegimen: async (id: string, regimenData: any) => {
    try {
      console.log(`Updating regimen ${id} with data:`, { 
        name: regimenData.name,
        category: regimenData.category
      });
      
      // Check for token to prevent obvious auth errors
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token available');
        toast.error('Please log in to update this regimen');
        throw new Error('Authentication token not available');
      }
      
      const response = await api.patch(`/regimens/${id}`, regimenData);
      const updatedRegimen = response.data.data || response.data;
      
      console.log('Regimen updated successfully:', {
        id: updatedRegimen._id || updatedRegimen.id,
        name: updatedRegimen.name
      });
      
      return updatedRegimen;
    } catch (error) {
      console.error(`Error updating regimen ${id}:`, error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Server responded with error:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Handle specific error codes
        if (error.response.status === 401) {
          toast.error('You must be logged in to update this regimen');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to update this regimen');
        } else if (error.response.status === 404) {
          toast.error('Regimen not found. It may have been deleted.');
        } else if (error.response.status === 400) {
          toast.error('Invalid regimen data. Please check all required fields.');
        } else {
          toast.error('Failed to update regimen. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('Server not responding. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        toast.error('An error occurred. Please try again.');
      }
      
      throw error;
    }
  },

  // Delete a regimen (coach only)
  deleteRegimen: async (id: string) => {
    try {
      console.log(`Deleting regimen ${id}`);
      
      // Check for token to prevent obvious auth errors
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token available');
        toast.error('Please log in to delete this regimen');
        throw new Error('Authentication token not available');
      }
      
      // First, try to handle associated workout logs
      try {
        // IMPORTANT: First, ensure proper data separation by deleting all associated workout logs
        console.log(`First deleting all workout logs for regimen ${id} to maintain data separation`);
        const logsResponse = await api.delete(`/workout-logs/regimen/${id}`);
        console.log(`Successfully deleted associated workout logs, response:`, logsResponse.status);
        toast.success('Successfully removed all workout logs for this program');
      } catch (logsError) {
        console.error(`Error deleting workout logs for regimen ${id}:`, logsError);
        toast.error('Failed to delete associated workout logs, but will continue with regimen deletion');
      }
      
      // Then delete the regimen itself
      const response = await api.delete(`/regimens/${id}`);
      
      console.log(`Regimen ${id} deleted successfully`);
      
      // Extra precaution: try one more time to delete logs to ensure no orphaned logs
      try {
        await api.delete(`/workout-logs/regimen/${id}`);
        console.log('Performed additional cleanup of any remaining workout logs');
      } catch (finalError) {
        // Ignore errors here, it's just an extra precaution
        console.warn('Additional cleanup attempt failed, but regimen was deleted successfully');
      }
      
      toast.success('Regimen and all associated workout logs deleted successfully');
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting regimen ${id}:`, error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Server responded with error:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Handle specific error codes
        if (error.response.status === 401) {
          toast.error('You must be logged in to delete this regimen');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to delete this regimen');
        } else if (error.response.status === 404) {
          toast.error('Regimen not found. It may have already been deleted.');
          
          // Also delete associated workout logs
          try {
            await api.delete(`/workout-logs/regimen/${id}`);
            toast.success('Regimen and associated workout logs deleted successfully');
          } catch (logsError) {
            // Ignore
          }
          
          // Return as if the operation was successful since the end state is the same (regimen is gone)
          return { success: true, message: 'Regimen already deleted' };
        } else {
          toast.error('Failed to delete regimen. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('Server not responding. Please check your connection.');
      } else {
        console.error('Error message:', error.message);
        toast.error('An error occurred. Please try again.');
      }
      
      throw error;
    }
  },
  
  // Delete all workout logs for a specific regimen
  deleteRegimenLogs: async (regimenId: string) => {
    try {
      const response = await api.delete(`/workout-logs/regimen/${regimenId}`);
      console.log(`Successfully deleted workout logs for regimen ${regimenId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting workout logs for regimen ${regimenId}:`, error);
      // We don't want to throw the error as this is a secondary operation
      // Just log it and continue
      return { success: false, error: error.message };
    }
  },

  // Function to fetch regimens for the coach's schedule view
  getCoachScheduleRegimens: async (): Promise<any[]> => {
    try {
      const response = await api.get<any>('/regimens/coach'); // Use /regimens/coach endpoint
      
      // Correctly extract the nested array
      const data = response.data?.data?.regimens; 
      
      if (Array.isArray(data)) {
        console.log(`Fetched ${data.length} regimens for schedule`);
        return data;
      } else {
        console.warn('Expected an array in response.data.data.regimens, but received:', response.data);
        return []; // Return empty array if structure is wrong or data is not array
      }
    } catch (error: any) {
      console.error('Error fetching coach schedule regimens:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch schedule data.';
      toast.error(errorMessage);
      return []; 
    }
  },

  // Fetch workout logs for the coach's dashboard/view
  getCoachWorkoutLogs: async (filter: string = 'myAthletes'): Promise<WorkoutLog[]> => {
    try {
      const response = await api.get<{ data: WorkoutLog[] }>(`/workout-logs/coach/my-athletes`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching coach workout logs:', error);
      return []; 
    }
  },
};

// Authentication service
export const authService = {
  // ... other auth functions ...
  getCurrentUser: async () => {
    try {
      // Corrected: Remove the leading /api/
      const userResponse = await api.get('/auth/me');
      return userResponse.data.data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
  // ... other auth functions ...
  // Function to request a password reset email
  forgotPassword: async (payload: { email: string }): Promise<any> => {
    try {
      // Call the /auth/forgot-password endpoint (no /api/ prefix needed due to baseURL)
      const response = await api.post('/auth/forgot-password', payload);
      console.log('Forgot password response:', response.data); 
      // Return the success response (might contain a message)
      return response.data;
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      // Extract message from backend error if possible
      const errorMessage = error.response?.data?.message || 'Failed to send password reset request.';
      toast.error(errorMessage);
      // Re-throw the error so the component can handle it if needed
      throw error; 
    }
  },

  // TODO: Add resetPassword function here later
  // resetPassword: async (token: string, payload: { password: string }): Promise<any> => { ... }
};

// Workout Logs Service
export const workoutLogsService = {
  getCoachWorkoutLogs: async (filter: string = 'myAthletes'): Promise<WorkoutLog[]> => {
    try {
      const response = await api.get<{ data: WorkoutLog[] }>(`/workout-logs/coach/my-athletes`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching coach workout logs:', error);
      return []; 
    }
  },
  getAthleteWorkoutLogs: async (athleteId: string) => {
    try {
      const response = await api.get(`/workout-logs/coach/athlete/${athleteId}`); // Corrected endpoint
      return response?.data?.data || [];
    } catch (error) {
      console.error(`Error fetching workout logs for athlete ${athleteId}:`, error);
      toast.error('Failed to load athlete logs');
      return [];
    }
  },
  getWorkoutLogStats: async () => {
    try {
      const response = await api.get('/workout-logs/coach/stats'); // Corrected endpoint
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      } else {
         console.warn('Invalid stats response:', response.data);
         return { hasData: false };
      }
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      return { hasData: false };
    }
  },
  createWorkoutLog: async (logData: any) => {
    try {
      const response = await api.post('/workout-logs', logData);
      return response.data;
    } catch (error) {
      console.error('Error creating workout log:', error);
      toast.error('Failed to save workout log');
      throw error;
    }
  },
  getMyWorkoutLogs: async () => {
    try {
      const response = await api.get('/workout-logs/my-logs');
      if (response.data && response.data.status === 'success') {
        const logs = response.data.data || [];
        logs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        return logs;
      } else {
        console.warn('Invalid logs response:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching athlete workout logs:', error);
      toast.error("Could not load your workout history.");
      return [];
    }
  },
  cleanupOrphanedLogs: async () => {
    try {
         const response = await api.delete('/workout-logs/cleanup');
         if (response.status === 200 && response.data?.status === 'success') {
             return { success: true, message: response.data.message || 'Cleanup successful' };
         } else {
             return { success: false, message: response.data?.message || 'Cleanup failed' };
         }
     } catch (error) {
         console.error('Cleanup error:', error);
         return { success: false, message: 'Failed to run cleanup' };
     }
  }
};

// Achievement Service
export const achievementService = {
  getMyAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await api.get<{ data: { achievements: Achievement[] } }>('/achievements/my-achievements');
      return response.data.data.achievements;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements.');
      throw error; // Re-throw to allow components to handle loading/error states
    }
  },
};

export default api; 