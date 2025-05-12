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
  User as UserIcon, 
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
  MessageSquare,
  UserCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import api, { clearUserCache } from '@/lib/api';
import { type User } from '@/types/user';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  qualifications: z.array(z.object({
    title: z.string(),
    institution: z.string().optional(),
    year: z.string().optional()
  })).optional(),
  avatarUrl: z.string().optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional()
  }).optional()
});

type CoachProfileFormData = z.infer<typeof formSchema>;

// Define a type that extends User with coach-specific fields
interface ExtendedUser extends Partial<CoachProfileFormData> {
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
  saveProfile: (data: CoachProfileFormData): string => {
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
  
  loadProfile: (): { data: CoachProfileFormData | null, timestamp: string | null } => {
    try {
      const savedData = localStorage.getItem(COACH_PROFILE_STORAGE_KEY);
      const savedTimestamp = localStorage.getItem(COACH_PROFILE_TIMESTAMP_KEY);
      
      if (savedData && savedTimestamp) {
        const parsedData = JSON.parse(savedData) as CoachProfileFormData;
        
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
  updateProfile: async (data: CoachProfileFormData): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/update-profile', {
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
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://coachshare-api.vercel.app/api'
        : 'http://localhost:8000/api';
        
      const response = await fetch(`${API_URL}/auth/me`, {
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

// Update the placeholder image URL
const PLACEHOLDER_IMAGE = 'https://ui-avatars.com/api/?background=random&color=fff&size=128';

interface CoachProfileProps {
  user: User;
  onUpdate?: (updatedUser: User) => void;
}

const CoachProfile: React.FC<CoachProfileProps> = ({ user, onUpdate }) => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<CoachProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    specialties: [],
    experience: '',
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<CoachProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: profileData
  });

  // Load initial profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data: response } = await api.get('/auth/me');
        
        if (response && response.data && response.data.user) {
          const userData = response.data.user;
          const formattedData: CoachProfileFormData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            bio: userData.bio || '',
            specialties: Array.isArray(userData.specialties) ? userData.specialties : [],
            experience: userData.experience || '',
            qualifications: Array.isArray(userData.qualifications) ? userData.qualifications.map(q => ({
              title: q.title || '',
              institution: q.institution || '',
              year: q.year || ''
            })) : [],
            avatarUrl: userData.avatarUrl || '',
            socialLinks: {
              website: userData.socialLinks?.website || '',
              linkedin: userData.socialLinks?.linkedin || '',
              instagram: userData.socialLinks?.instagram || '',
              twitter: userData.socialLinks?.twitter || '',
              facebook: userData.socialLinks?.facebook || '',
              youtube: userData.socialLinks?.youtube || ''
            }
          };
          
          setProfileData(formattedData);
          form.reset(formattedData);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []); // Only run on mount

  // Update form when profile data changes
  useEffect(() => {
    form.reset(profileData);
  }, [profileData]);

  const handleSubmit = async (data: CoachProfileFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: response } = await api.post('/auth/update-profile', data);
      
      if (response && response.data && response.data.user) {
        const updatedData = {
          ...data,
          id: response.data.user._id // Preserve the ID from the response
        };
        
        setProfileData(updatedData);
        
        if (onUpdate) {
          onUpdate(response.data.user);
        }
        
        toast({
          title: "Success!",
          description: "Your profile has been updated.",
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle avatar image upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      try {
        // Create form data
        const formData = new FormData();
        formData.append('avatar', file);

        // Clear all caches before upload
        clearUserCache();
        localStorage.removeItem('coachshare_secure_coach_profile_data');
        localStorage.removeItem('coachshare_secure_coach_profile_timestamp');

        // Upload to server
        const response = await fetch('http://localhost:8000/api/users/upload-avatar', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Update form with new avatar URL
        form.setValue('avatarUrl', data.data.avatarUrl);
        setProfileData(prev => ({
          ...prev,
          avatarUrl: data.data.avatarUrl
        }));

        // Force reload profile data
        const { data: response2 } = await api.get('/auth/me');
        if (response2 && response2.data && response2.data.user) {
          const userData = response2.data.user;
          setProfileData(prev => ({
            ...prev,
            avatarUrl: userData.avatarUrl
          }));
        }

        toast({
          title: 'Success',
          description: 'Profile picture updated successfully.',
        });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: 'Failed to upload profile picture. Please try again.',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Coach Profile | CoachShare</title>
      </Helmet>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Coach Profile</CardTitle>
          <CardDescription>
            Manage your professional profile and settings
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatarUrl || PLACEHOLDER_IMAGE} />
                    <AvatarFallback>
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-gray-500">{profileData.email}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tell athletes about your coaching experience and expertise..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Experience */}
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 5+ years of coaching experience" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specialties */}
              <div className="space-y-4">
                <FormLabel>Specialties</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {form.watch('specialties')?.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => {
                          const specialties = form.getValues('specialties') || [];
                          form.setValue(
                            'specialties',
                            specialties.filter((_, i) => i !== index)
                          );
                        }}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a specialty"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value) {
                          const specialties = form.getValues('specialties') || [];
                          form.setValue('specialties', [...specialties, value]);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a specialty"]') as HTMLInputElement;
                      if (input) {
                        const value = input.value.trim();
                        if (value) {
                          const specialties = form.getValues('specialties') || [];
                          form.setValue('specialties', [...specialties, value]);
                          input.value = '';
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-4">
                <FormLabel>Qualifications</FormLabel>
                {form.watch('qualifications')?.map((qualification, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Qualification title"
                        value={qualification.title}
                        onChange={(e) => {
                          const qualifications = form.getValues('qualifications') || [];
                          qualifications[index] = {
                            ...qualification,
                            title: e.target.value
                          };
                          form.setValue('qualifications', qualifications);
                        }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Institution"
                          value={qualification.institution}
                          onChange={(e) => {
                            const qualifications = form.getValues('qualifications') || [];
                            qualifications[index] = {
                              ...qualification,
                              institution: e.target.value
                            };
                            form.setValue('qualifications', qualifications);
                          }}
                        />
                        <Input
                          placeholder="Year"
                          value={qualification.year}
                          onChange={(e) => {
                            const qualifications = form.getValues('qualifications') || [];
                            qualifications[index] = {
                              ...qualification,
                              year: e.target.value
                            };
                            form.setValue('qualifications', qualifications);
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const qualifications = form.getValues('qualifications') || [];
                        form.setValue(
                          'qualifications',
                          qualifications.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const qualifications = form.getValues('qualifications') || [];
                    form.setValue('qualifications', [
                      ...qualifications,
                      { title: '', institution: '', year: '' }
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Qualification
                </Button>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <FormLabel>Social Links</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialLinks.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://your-website.com" />
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
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://linkedin.com/in/username" />
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
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://instagram.com/username" />
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
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://twitter.com/username" />
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
                          <Facebook className="h-4 w-4 mr-2" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://facebook.com/username" />
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
                          <Youtube className="h-4 w-4 mr-2" />
                          YouTube
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://youtube.com/c/channel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachProfile; 