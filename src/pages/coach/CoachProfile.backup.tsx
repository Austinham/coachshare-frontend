import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  School, 
  Star, 
  Camera, 
  Trash2, 
  Plus, 
  Save, 
  X,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Globe,
  UserPlus,
  Award,
  Mail,
  MessageSquare
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

// Define form schema with Zod
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters." }).optional(),
  experience: z.string().optional(),
  specialties: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.object({
    title: z.string(),
    institution: z.string().optional(),
    year: z.string().optional()
  })).optional(),
  avatarUrl: z.string().url().optional(),
  socialLinks: z.object({
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal(''))
  }).optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Define a type that extends User with coach-specific fields
interface ExtendedUser extends Partial<ProfileFormValues> {
  firstName?: string;
  lastName?: string;
  email?: string;
  id?: string;
}

// Storage keys with prefix for better organization
const STORAGE_PREFIX = 'coachshare_secure_';
const COACH_PROFILE_STORAGE_KEY = `${STORAGE_PREFIX}coach_profile_data`;
const COACH_PROFILE_TIMESTAMP_KEY = `${STORAGE_PREFIX}coach_profile_timestamp`;

// Utility functions for storage access - using a service pattern
const StorageService = {
  saveProfile: (data: ProfileFormValues): string => {
    try {
      // Create a deep copy of the data to ensure all nested structures are saved
      const profileData = JSON.parse(JSON.stringify(data));
      
      // Sanitize data before storing (optional for production security)
      const sanitizedData = profileData;
      
      // Ensure all required fields exist to prevent partial saves
      const ensuredData = {
        firstName: sanitizedData.firstName || '',
        lastName: sanitizedData.lastName || '',
        bio: sanitizedData.bio || '',
        experience: sanitizedData.experience || '',
        specialties: Array.isArray(sanitizedData.specialties) ? sanitizedData.specialties : [],
        qualifications: Array.isArray(sanitizedData.qualifications) ? sanitizedData.qualifications : [],
        avatarUrl: sanitizedData.avatarUrl || '',
        socialLinks: {
          website: sanitizedData.socialLinks?.website || '',
          linkedin: sanitizedData.socialLinks?.linkedin || '',
          instagram: sanitizedData.socialLinks?.instagram || '',
          twitter: sanitizedData.socialLinks?.twitter || '',
          facebook: sanitizedData.socialLinks?.facebook || '',
          youtube: sanitizedData.socialLinks?.youtube || ''
        }
      };
      
      // Store with timestamp
      const timestamp = new Date().toISOString();
      localStorage.setItem(COACH_PROFILE_STORAGE_KEY, JSON.stringify(ensuredData));
      localStorage.setItem(COACH_PROFILE_TIMESTAMP_KEY, timestamp);
      
      console.log('Profile saved to localStorage', ensuredData);
      return timestamp;
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
      return '';
    }
  },
  
  loadProfile: (): { data: ProfileFormValues | null, timestamp: string | null } => {
    try {
      const savedData = localStorage.getItem(COACH_PROFILE_STORAGE_KEY);
      const savedTimestamp = localStorage.getItem(COACH_PROFILE_TIMESTAMP_KEY);
      
      if (savedData && savedTimestamp) {
        const parsedData = JSON.parse(savedData) as ProfileFormValues;
        
        // Ensure all fields are present to prevent undefined values
        const validatedData = {
          firstName: parsedData.firstName || '',
          lastName: parsedData.lastName || '',
          bio: parsedData.bio || '',
          experience: parsedData.experience || '',
          specialties: Array.isArray(parsedData.specialties) ? parsedData.specialties : [],
          qualifications: Array.isArray(parsedData.qualifications) ? parsedData.qualifications : [],
          avatarUrl: parsedData.avatarUrl || '',
          socialLinks: {
            website: parsedData.socialLinks?.website || '',
            linkedin: parsedData.socialLinks?.linkedin || '',
            instagram: parsedData.socialLinks?.instagram || '',
            twitter: parsedData.socialLinks?.twitter || '',
            facebook: parsedData.socialLinks?.facebook || '',
            youtube: parsedData.socialLinks?.youtube || ''
          }
        };
        
        console.log('Profile loaded from localStorage', validatedData);
        return {
          data: validatedData,
          timestamp: savedTimestamp
        };
      }
      
      return { data: null, timestamp: null };
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
      return { data: null, timestamp: null };
    }
  },
  
  clearProfileData: () => {
    try {
      localStorage.removeItem(COACH_PROFILE_STORAGE_KEY);
      localStorage.removeItem(COACH_PROFILE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing profile data:', error);
    }
  }
};

// API service for consistent API calls
const ProfileApiService = {
  updateProfile: async (data: ProfileFormValues): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (response.ok) {
        return { success: true, message: 'Profile updated successfully' };
      }
      
      // Try to extract error message from response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          return { 
            success: false, 
            message: errorData.message || `Server error: ${response.status}`
          };
        } catch (parseError) {
          return { success: false, message: `Server error: ${response.status}` };
        }
      } else {
        return { success: false, message: `Server error: ${response.status}` };
      }
    } catch (error) {
      console.error('API error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error while saving profile'
      };
    }
  },
  
  fetchProfile: async (): Promise<{ success: boolean, data?: any, message?: string }> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        return { 
          success: false, 
          message: `Error ${response.status}: ${response.statusText}`
        };
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { 
          success: false, 
          message: 'Received non-JSON response from server'
        };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error fetching profile'
      };
    }
  }
};

const CoachProfile: React.FC = () => {
  const { user } = useAuth();
  const extendedUser = user as ExtendedUser; // Cast to our extended type
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editMode, setEditMode] = useState(false); // Track if we're in edit mode
  const [connectOpen, setConnectOpen] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: 'Austin',
      lastName: 'Hamilton',
      bio: '',
      experience: '20 Years',
      specialties: ['sprint'],
      qualifications: [],
      avatarUrl: '',
      socialLinks: {
        website: '',
        linkedin: '',
        instagram: '',
        twitter: '',
        facebook: '',
        youtube: ''
      }
    }
  });
  
  // Subscribe to form changes to detect unsaved changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        setHasUnsavedChanges(true);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Reset form to last saved state
  const resetForm = () => {
    const { data } = StorageService.loadProfile();
    if (data) {
      form.reset(data);
      if (data.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
      }
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Form reset',
        description: 'Changes have been discarded and form has been reset to the last saved state.',
      });
    }
  };
  
  // Warning on page leave if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // This message isn't actually displayed in modern browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load saved data from localStorage on initial render
  useEffect(() => {
    try {
      const { data: savedData, timestamp: savedTimestamp } = StorageService.loadProfile();
      
      if (savedData && savedTimestamp) {
        // Ensure all form fields are properly populated
        const completeData = {
          firstName: savedData.firstName || extendedUser?.firstName || '',
          lastName: savedData.lastName || extendedUser?.lastName || '',
          bio: savedData.bio || '',
          experience: savedData.experience || '',
          specialties: savedData.specialties || [],
          qualifications: savedData.qualifications || [],
          avatarUrl: savedData.avatarUrl || '',
          socialLinks: savedData.socialLinks || {
            website: '',
            linkedin: '',
            instagram: '',
            twitter: '',
            facebook: '',
            youtube: ''
          }
        };
        
        // Reset form with complete data
        form.reset(completeData);
        
        if (completeData.avatarUrl) {
          setAvatarPreview(completeData.avatarUrl);
        }
        setLastSaved(savedTimestamp);
        
        console.info('Loaded profile data from local storage', { 
          timestamp: savedTimestamp,
          data: completeData
        });
      }
    } catch (error) {
      console.error('Error loading saved profile data:', error);
      // Continue with API data fetch if local storage fails
    }
  }, []);

  // Fetch coach data
  useEffect(() => {
    let isMounted = true; // For cleanup
    
    const fetchCoachData = async () => {
      if (!extendedUser) return; // Exit early if no user is available
      
      setLoading(true);
      
      // First try to load from localStorage for instant display
      const { data: savedData, timestamp: savedTimestamp } = StorageService.loadProfile();
      
      if (savedData && savedTimestamp && isMounted) {
        // Update form with saved data for immediate display
        form.reset(savedData);
        setAvatarPreview(savedData.avatarUrl || null);
        setLastSaved(savedTimestamp);
        console.info('Loaded profile data from local storage', { timestamp: savedTimestamp });
      }
      
      try {
        // Then try to fetch fresh data from API
        const apiResult = await ProfileApiService.fetchProfile();
        
        // Only proceed if component is still mounted
        if (!isMounted) return;
        
        if (apiResult.success && apiResult.data) {
          // Transform API data to match form structure
          const coachData = {
            firstName: apiResult.data.user?.firstName || extendedUser?.firstName || '',
            lastName: apiResult.data.user?.lastName || extendedUser?.lastName || '',
            bio: apiResult.data.user?.bio || extendedUser?.bio || '',
            experience: apiResult.data.user?.experience || extendedUser?.experience || '',
            specialties: apiResult.data.user?.specialties || extendedUser?.specialties || [],
            qualifications: apiResult.data.user?.qualifications || extendedUser?.qualifications || [],
            avatarUrl: apiResult.data.user?.avatarUrl || extendedUser?.avatarUrl || '',
            socialLinks: apiResult.data.user?.socialLinks || extendedUser?.socialLinks || {
              website: '',
              linkedin: '',
              instagram: '',
              twitter: '',
              facebook: '',
              youtube: ''
            }
          };
          
          // If we have newer server data compared to localStorage, update
          if (!savedTimestamp || new Date(apiResult.data.user?.updatedAt) > new Date(savedTimestamp)) {
            // Set form values with fetched data
            form.reset(coachData);
            setAvatarPreview(coachData.avatarUrl);
            
            // Save the newer data to localStorage
            const newTimestamp = StorageService.saveProfile(coachData);
            if (newTimestamp) setLastSaved(newTimestamp);
            
            console.info('Updated with newer data from API');
          }
        } else if (!savedData) {
          // If API failed and we don't have localStorage data, use fallback
          console.warn('API fetch failed, using fallback data', apiResult.message);
          
          // Use fallback data from user context
          const fallbackData = {
            firstName: extendedUser.firstName || '',
            lastName: extendedUser.lastName || '',
            bio: extendedUser.bio || '',
            experience: extendedUser.experience || '',
            specialties: extendedUser.specialties || [],
            qualifications: extendedUser.qualifications || [],
            avatarUrl: extendedUser.avatarUrl || '',
            socialLinks: extendedUser.socialLinks || {
              website: '',
              linkedin: '',
              instagram: '',
              twitter: '',
              facebook: '',
              youtube: ''
            }
          };
          
          form.reset(fallbackData);
          setAvatarPreview(fallbackData.avatarUrl);
        }
      } catch (error) {
        console.error('Error in fetchCoachData:', error);
        
        // Only show error toast if we couldn't load from any source
        if (!savedData && isMounted) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load profile data. Please refresh the page.',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchCoachData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [form, extendedUser]);

  // Add a specialty to the list
  const addSpecialty = () => {
    if (!specialty.trim()) return;
    
    const currentSpecialties = form.getValues().specialties || [];
    // Check for duplicates (case-insensitive)
    if (!currentSpecialties.some(s => s.toLowerCase() === specialty.toLowerCase())) {
      form.setValue('specialties', [...currentSpecialties, specialty.trim()]);
    }
    setSpecialty('');
  };

  // Remove a specialty from the list
  const removeSpecialty = (index: number) => {
    const currentSpecialties = form.getValues().specialties || [];
    if (index >= 0 && index < currentSpecialties.length) {
      form.setValue('specialties', currentSpecialties.filter((_, i) => i !== index));
    }
  };

  // Add a qualification to the list
  const addQualification = () => {
    const currentQualifications = form.getValues().qualifications || [];
    form.setValue('qualifications', [
      ...currentQualifications, 
      { title: '', institution: '', year: '' }
    ]);
  };

  // Remove a qualification from the list
  const removeQualification = (index: number) => {
    const currentQualifications = form.getValues().qualifications || [];
    if (index >= 0 && index < currentQualifications.length) {
      form.setValue('qualifications', currentQualifications.filter((_, i) => i !== index));
    }
  };

  // Handle avatar image upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'The image must be less than 5MB in size.',
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select an image file.',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
          form.setValue('avatarUrl', reader.result);
        }
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to read the image file.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Format a timestamp in a human-readable format
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Toggle edit mode and preview functions
  const toggleEditMode = () => {
    if (editMode && hasUnsavedChanges) {
      // Ask for confirmation before exiting edit mode with unsaved changes
      if (window.confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
        setEditMode(false);
        resetForm(); // Reset to last saved state
      }
    } else {
      setEditMode(!editMode);
    }
  };
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
    setEditMode(false); // Exit edit mode when previewing
  };
  
  // Submit handler with exit from edit mode
  const onSubmit = async (data: ProfileFormValues | any) => {
    // Ensure we're getting the form data regardless of how onSubmit was called
    const formData = form.getValues();
    console.log("Form submitted, starting save process", formData);
    setLoading(true);
    
    // Exit edit mode immediately to ensure it happens
    console.log("Setting editMode to false");
    setEditMode(false);
    
    try {
      // Ensure all required data is present before saving
      const completeData = {
        ...formData,
        specialties: formData.specialties || [],
        qualifications: formData.qualifications || [],
        socialLinks: formData.socialLinks || {
          website: '',
          linkedin: '',
          instagram: '',
          twitter: '',
          facebook: '',
          youtube: ''
        }
      };
      
      // Save to localStorage first for immediate persistence
      const timestamp = StorageService.saveProfile(completeData);
      if (timestamp) setLastSaved(timestamp);
      
      // Update UI immediately 
      if (completeData.avatarUrl) {
        setAvatarPreview(completeData.avatarUrl);
      }
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Attempt to save to API
      const apiResult = await ProfileApiService.updateProfile(completeData);
      
      // Show appropriate message based on API result
      toast({
        title: apiResult.success ? 'Profile saved to server' : 'Profile saved locally',
        description: apiResult.success ? 
          'Your profile has been successfully updated and saved to the server.' : 
          'Your profile has been saved to your browser. Changes will sync to server when connection is available.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Your data has been saved locally.',
      });
    } finally {
      // Ensure edit mode is off even if there was an error
      setEditMode(false);
      setLoading(false);
      console.log("Save process completed, editMode should be false");
    }
  };

  // Auto-save feature
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    // Save after 5 seconds of inactivity
    const autoSaveTimeout = setTimeout(() => {
      // Get complete form data with all fields
      const completeFormData = form.getValues();
      
      // Ensure we have all required data structures
      const formData = {
        ...completeFormData,
        specialties: completeFormData.specialties || [],
        qualifications: completeFormData.qualifications || [],
        socialLinks: completeFormData.socialLinks || {
          website: '',
          linkedin: '',
          instagram: '',
          twitter: '',
          facebook: '',
          youtube: ''
        }
      };
      
      // Only auto-save to localStorage, not to API
      const timestamp = StorageService.saveProfile(formData);
      if (timestamp) {
        setLastSaved(timestamp);
        console.info('Auto-saved profile data', formData);
      }
    }, 5000);
    
    return () => clearTimeout(autoSaveTimeout);
  }, [form, hasUnsavedChanges]);

  // Global state tracking for edit mode and loading
  useEffect(() => {
    if (!loading && !hasUnsavedChanges) {
      console.log("Global state check: form saved and not loading, ensuring edit mode is off");
      setEditMode(false);
    }
  }, [loading, hasUnsavedChanges]);

  // Force edit mode to false when tab changes
  useEffect(() => {
    // When activeTab changes, force exit edit mode
    setEditMode(false);
    console.log("Tab changed, exiting edit mode");
  }, [activeTab]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Force cleanup of any lingering state
      setEditMode(false);
    };
  }, []);

  // Handle connect button click
  const handleConnect = (type: 'email' | 'message') => {
    if (type === 'email') {
      // If we have coach's email, open mailto link
      window.open(`mailto:${extendedUser?.email || ''}?subject=Coaching%20Inquiry&body=Hello%20${form.getValues().firstName},%0A%0AI%20saw%20your%20profile%20on%20CoachShare%20and%20I'm%20interested%20in%20learning%20more%20about%20your%20coaching%20services.`);
    } else {
      // For in-app messaging
      toast({
        title: "Message started",
        description: `Your conversation with ${form.getValues().firstName} has been created.`,
      });
      
      // Navigate to the messages page with this coach selected
      navigate(`/app/messages/${extendedUser?.id || '3'}`);
    }
    
    setConnectOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Coach Profile | CoachShare</title>
      </Helmet>
      
      <div className="container mx-auto p-4 max-w-6xl" key={editMode ? 'edit-mode' : 'view-mode'}>
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold">Coach Profile</h1>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-sm text-muted-foreground flex items-center">
                {hasUnsavedChanges && (
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2" title="Unsaved changes"></span>
                )}
                Last saved: {formatTimestamp(lastSaved)}
              </span>
            )}
            <Button variant="outline" onClick={() => setEditMode(!editMode)} className="mr-2">
              {editMode ? "Cancel Editing" : "Edit Information"}
            </Button>
            <Button variant="outline" onClick={togglePreview}>
              {showPreview ? "Exit Preview" : "Preview Public Profile"}
            </Button>
          </div>
        </div>
        
        {showPreview ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="h-32 w-32 rounded-full overflow-hidden">
                    <img 
                      src={avatarPreview || "https://via.placeholder.com/128"}
                      alt={`${form.getValues().firstName} ${form.getValues().lastName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {form.watch('specialties')?.length > 0 && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow border">
                      <span className="text-xs font-medium">{form.watch('specialties')?.[0]}</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold">
                  {form.watch('firstName')} {form.watch('lastName')}
                </h2>
                
                {form.watch('experience') && (
                  <p className="text-sm text-gray-500 mt-1">{form.watch('experience')} Experience</p>
                )}
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-gray-700">
                  {form.watch('bio') || "No bio available."}
                </p>
              </div>
              
              {form.watch('qualifications')?.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-2">Qualifications</h3>
                  <ul className="space-y-4">
                    {form.watch('qualifications')?.map((qualification, index) => (
                      <li key={index} className="flex items-start">
                        <Award className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                        <div>
                          <p className="font-medium">{qualification.title}</p>
                          {qualification.institution && (
                            <p className="text-sm text-gray-600">{qualification.institution}</p>
                          )}
                          {qualification.year && (
                            <p className="text-xs text-gray-500">Since {qualification.year}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Social Media Links */}
              {Object.values(form.watch('socialLinks') || {}).some(link => link) && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Connect With Me</h3>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {form.watch('socialLinks.website') && (
                      <a 
                        href={form.watch('socialLinks.website')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Globe className="h-5 w-5 text-gray-700" />
                      </a>
                    )}
                    
                    {form.watch('socialLinks.linkedin') && (
                      <a 
                        href={form.watch('socialLinks.linkedin')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <Linkedin className="h-5 w-5 text-blue-700" />
                      </a>
                    )}
                    
                    {form.watch('socialLinks.instagram') && (
                      <a 
                        href={form.watch('socialLinks.instagram')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-pink-100 rounded-full hover:bg-pink-200 transition-colors"
                      >
                        <Instagram className="h-5 w-5 text-pink-700" />
                      </a>
                    )}
                    
                    {form.watch('socialLinks.twitter') && (
                      <a 
                        href={form.watch('socialLinks.twitter')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <Twitter className="h-5 w-5 text-blue-500" />
                      </a>
                    )}
                    
                    {form.watch('socialLinks.facebook') && (
                      <a 
                        href={form.watch('socialLinks.facebook')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <Facebook className="h-5 w-5 text-blue-800" />
                      </a>
                    )}
                    
                    {form.watch('socialLinks.youtube') && (
                      <a 
                        href={form.watch('socialLinks.youtube')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <Youtube className="h-5 w-5 text-red-700" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-8">
                <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full max-w-md">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Connect with Coach
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Connect with {form.watch('firstName')}</DialogTitle>
                      <DialogDescription>
                        Choose how you'd like to reach out to {form.watch('firstName')} {form.watch('lastName')}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button 
                        onClick={() => handleConnect('message')} 
                        className="flex items-center justify-start gap-2 h-auto py-3"
                        variant="outline"
                      >
                        <div className="bg-blue-100 p-2 rounded-full">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Message in App</div>
                          <div className="text-sm text-gray-500">Start a conversation directly in CoachShare</div>
                        </div>
                      </Button>
                      
                      <Button 
                        onClick={() => handleConnect('email')} 
                        className="flex items-center justify-start gap-2 h-auto py-3"
                        variant="outline"
                      >
                        <div className="bg-green-100 p-2 rounded-full">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Send Email</div>
                          <div className="text-sm text-gray-500">Contact via email using your email client</div>
                        </div>
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setConnectOpen(false)}>Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  // Prevent the default form submission
                  e.preventDefault();
                  console.log("Form onSubmit triggered, but using direct handler");
                  // We're handling submissions through button clicks now
                }}
              >
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        {editMode ? 
                          "Update your personal information and bio." : 
                          "Your personal information and bio."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                        <div className="relative group">
                          <Avatar className="h-32 w-32 border-2 border-gray-200">
                            <AvatarImage src={avatarPreview || undefined} alt="Profile" />
                            <AvatarFallback>
                              {getInitials(form.getValues().firstName, form.getValues().lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {editMode && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                              <label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full bg-white">
                                <Camera className="h-5 w-5 text-gray-700" />
                                <input 
                                  id="avatar-upload" 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleAvatarChange} 
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 w-full">
                          {editMode ? (
                            /* Edit Mode Forms */
                            <div className="edit-only">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="First name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Last name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem className="mt-4">
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Tell athletes about yourself, your coaching style, and your approach..." 
                                        className="resize-none min-h-[120px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      {field.value?.length || 0}/500 characters
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="experience"
                                render={({ field }) => (
                                  <FormItem className="mt-4">
                                    <FormLabel>Experience</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., 5+ years" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Years of coaching experience
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : (
                            /* Read-only View */
                            <div className="view-only space-y-6">
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                                <p className="mt-1 text-lg">{form.getValues().firstName} {form.getValues().lastName}</p>
                              </div>
                              
                              {form.getValues().experience && (
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                                  <p className="mt-1">{form.getValues().experience}</p>
                                </div>
                              )}
                              
                              {form.getValues().bio && (
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                                  <p className="mt-1 whitespace-pre-wrap">{form.getValues().bio}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {editMode ? (
                          <div className="edit-only">
                            <FormLabel>Specialties</FormLabel>
                            <div className="flex items-center gap-2 mb-2">
                              <Input 
                                placeholder="Add a specialty (e.g., Strength Training)" 
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSpecialty();
                                  }
                                }}
                              />
                              <Button type="button" onClick={addSpecialty} size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.watch('specialties')?.map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                                  {specialty}
                                  <button 
                                    type="button" 
                                    onClick={() => removeSpecialty(index)}
                                    className="ml-1 rounded-full hover:bg-gray-300/20 p-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            
                            {form.formState.errors.specialties && (
                              <p className="text-sm font-medium text-destructive mt-1">
                                {form.formState.errors.specialties.message}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2 view-only">
                            <h3 className="text-sm font-medium text-gray-500 w-full mb-1">Specialties</h3>
                            {form.getValues().specialties?.map((specialty, index) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                            {!form.getValues().specialties?.length && (
                              <p className="text-sm text-gray-500">No specialties added</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {editMode && (
                      <CardFooter className="flex justify-between border-t pt-4">
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={resetForm}
                            disabled={!hasUnsavedChanges || loading}
                          >
                            Reset Changes
                          </Button>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => {
                            console.log("Save button clicked directly");
                            // Force edit mode to false immediately - updating React state and UI
                            setEditMode(false);
                            document.querySelectorAll('.edit-only').forEach(el => {
                              (el as HTMLElement).style.display = 'none';
                            });
                            document.querySelectorAll('.view-only').forEach(el => {
                              (el as HTMLElement).style.display = 'block';
                            });
                            // Then process the save
                            onSubmit(form.getValues());
                          }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                  
                  {/* Social Media & Online Presence */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Media & Online Presence</CardTitle>
                      <CardDescription>
                        {editMode ? 
                          "Connect your social media profiles to showcase your work." : 
                          "Your connected social media profiles."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {editMode ? (
                        <div className="space-y-4 edit-only">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="socialLinks.website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                                    Website
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://yourwebsite.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="socialLinks.linkedin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                                    LinkedIn
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="socialLinks.instagram"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                                    Instagram
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://instagram.com/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="socialLinks.twitter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                                    Twitter
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://twitter.com/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="socialLinks.facebook"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Facebook className="h-4 w-4 mr-2 text-blue-700" />
                                    Facebook
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://facebook.com/username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="socialLinks.youtube"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                                    YouTube
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://youtube.com/c/channel" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 view-only">
                          {Object.entries(form.getValues().socialLinks || {}).some(([_, value]) => value) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {form.getValues().socialLinks?.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-gray-500" />
                                  <a 
                                    href={form.getValues().socialLinks?.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.website}
                                  </a>
                                </div>
                              )}
                              
                              {form.getValues().socialLinks?.linkedin && (
                                <div className="flex items-center gap-2">
                                  <Linkedin className="h-5 w-5 text-blue-600" />
                                  <a 
                                    href={form.getValues().socialLinks?.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.linkedin}
                                  </a>
                                </div>
                              )}
                              
                              {form.getValues().socialLinks?.instagram && (
                                <div className="flex items-center gap-2">
                                  <Instagram className="h-5 w-5 text-pink-600" />
                                  <a 
                                    href={form.getValues().socialLinks?.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.instagram}
                                  </a>
                                </div>
                              )}
                              
                              {form.getValues().socialLinks?.twitter && (
                                <div className="flex items-center gap-2">
                                  <Twitter className="h-5 w-5 text-blue-400" />
                                  <a 
                                    href={form.getValues().socialLinks?.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.twitter}
                                  </a>
                                </div>
                              )}
                              
                              {form.getValues().socialLinks?.facebook && (
                                <div className="flex items-center gap-2">
                                  <Facebook className="h-5 w-5 text-blue-700" />
                                  <a 
                                    href={form.getValues().socialLinks?.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.facebook}
                                  </a>
                                </div>
                              )}
                              
                              {form.getValues().socialLinks?.youtube && (
                                <div className="flex items-center gap-2">
                                  <Youtube className="h-5 w-5 text-red-600" />
                                  <a 
                                    href={form.getValues().socialLinks?.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {form.getValues().socialLinks?.youtube}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500">No social media profiles linked.</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                    {editMode && (
                      <CardFooter className="flex justify-end border-t pt-4">
                        <Button 
                          type="button" 
                          onClick={() => {
                            console.log("Save button clicked directly");
                            // Force edit mode to false immediately - updating React state and UI
                            setEditMode(false);
                            document.querySelectorAll('.edit-only').forEach(el => {
                              (el as HTMLElement).style.display = 'none';
                            });
                            document.querySelectorAll('.view-only').forEach(el => {
                              (el as HTMLElement).style.display = 'block';
                            });
                            // Then process the save
                            onSubmit(form.getValues());
                          }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Credentials Tab */}
                <TabsContent value="credentials" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Qualifications & Certifications</CardTitle>
                      <CardDescription>
                        {editMode ? 
                          "Add your professional qualifications, certifications, and credentials." : 
                          "Your professional qualifications, certifications, and credentials."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        {editMode ? (
                          <div className="edit-only">
                            <div className="flex items-center justify-between">
                              <FormLabel>Qualifications</FormLabel>
                              <Button 
                                type="button" 
                                onClick={addQualification}
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-xs"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Qualification
                              </Button>
                            </div>
                            
                            {form.watch('qualifications')?.map((qualification, index) => (
                              <div key={index} className="flex flex-col space-y-2 mt-4 p-4 border rounded-md relative">
                                <button
                                  type="button"
                                  onClick={() => removeQualification(index)}
                                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="md:col-span-3">
                                    <FormLabel htmlFor={`qualifications.${index}.title`}>Title/Certification</FormLabel>
                                    <Input
                                      id={`qualifications.${index}.title`}
                                      placeholder="e.g., Certified Strength and Conditioning Specialist"
                                      {...form.register(`qualifications.${index}.title`)}
                                    />
                                  </div>
                                  
                                  <div className="md:col-span-2">
                                    <FormLabel htmlFor={`qualifications.${index}.institution`}>Institution</FormLabel>
                                    <Input
                                      id={`qualifications.${index}.institution`}
                                      placeholder="e.g., National Strength and Conditioning Association"
                                      {...form.register(`qualifications.${index}.institution`)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <FormLabel htmlFor={`qualifications.${index}.year`}>Year</FormLabel>
                                    <Input
                                      id={`qualifications.${index}.year`}
                                      placeholder="e.g., 2020"
                                      {...form.register(`qualifications.${index}.year`)}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {form.watch('qualifications')?.length === 0 && (
                              <div className="flex flex-col items-center justify-center p-8 border rounded-md border-dashed mt-4">
                                <Award className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-gray-500">No qualifications added yet</p>
                                <Button 
                                  type="button" 
                                  onClick={addQualification} 
                                  variant="outline" 
                                  className="mt-4"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Your First Qualification
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="view-only">
                            <h3 className="font-medium mb-4">Qualifications</h3>
                            {form.getValues().qualifications?.length ? (
                              <ul className="space-y-6">
                                {form.getValues().qualifications?.map((qualification, index) => (
                                  <li key={index} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start">
                                      <Award className="h-5 w-5 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                                      <div>
                                        <h4 className="font-medium text-lg">{qualification.title}</h4>
                                        {qualification.institution && (
                                          <p className="text-gray-600">{qualification.institution}</p>
                                        )}
                                        {qualification.year && (
                                          <p className="text-sm text-gray-500 mt-1">Issued: {qualification.year}</p>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-center p-6">No qualifications have been added.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {editMode && (
                      <CardFooter className="flex justify-between border-t pt-4">
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={resetForm}
                            disabled={!hasUnsavedChanges || loading}
                          >
                            Reset Changes
                          </Button>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => {
                            console.log("Save button clicked directly");
                            // Force edit mode to false immediately - updating React state and UI
                            setEditMode(false);
                            document.querySelectorAll('.edit-only').forEach(el => {
                              (el as HTMLElement).style.display = 'none';
                            });
                            document.querySelectorAll('.view-only').forEach(el => {
                              (el as HTMLElement).style.display = 'block';
                            });
                            // Then process the save
                            onSubmit(form.getValues());
                          }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        {editMode ? 
                          "Manage your profile settings and privacy preferences." : 
                          "Your profile settings and privacy preferences."}
                        {lastSaved && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded text-green-800 text-sm flex items-center">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            Your profile was saved on {formatTimestamp(lastSaved)}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <h3 className="font-medium">Public Profile</h3>
                            <p className="text-sm text-gray-500">Allow athletes to find your profile</p>
                          </div>
                          {editMode ? (
                            <div className="form-control">
                              <label className="cursor-pointer label">
                                <input type="checkbox" defaultChecked className="toggle toggle-primary" />
                              </label>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-t">
                          <div>
                            <h3 className="font-medium">Display Email</h3>
                            <p className="text-sm text-gray-500">Show your email on your public profile</p>
                          </div>
                          {editMode ? (
                            <div className="form-control">
                              <label className="cursor-pointer label">
                                <input type="checkbox" className="toggle toggle-primary" />
                              </label>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500">Disabled</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-t">
                          <div>
                            <h3 className="font-medium">Notification Preferences</h3>
                            <p className="text-sm text-gray-500">Manage email and in-app notifications</p>
                          </div>
                          {editMode ? (
                            <Button variant="outline" size="sm">Manage</Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled={!editMode}>View</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    {editMode && (
                      <CardFooter className="flex justify-end border-t pt-4">
                        <Button 
                          type="button" 
                          onClick={() => {
                            console.log("Save button clicked directly");
                            // Force edit mode to false immediately - updating React state and UI
                            setEditMode(false);
                            document.querySelectorAll('.edit-only').forEach(el => {
                              (el as HTMLElement).style.display = 'none';
                            });
                            document.querySelectorAll('.view-only').forEach(el => {
                              (el as HTMLElement).style.display = 'block';
                            });
                            // Then process the save
                            onSubmit(form.getValues());
                          }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default CoachProfile; 