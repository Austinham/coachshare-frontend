import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, RefreshCw, UserX, Shield, UserCog, Bell, Save, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

type TabType = 'profile' | 'security' | 'notifications';

const Settings: React.FC = () => {
  const auth = useAuth();
  const { user, isLoading, updateProfile, deleteAccount } = auth;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Email preferences state
  const [emailPreferences, setEmailPreferences] = useState({
    emailUpdates: true,
    emailReminders: true,
  });
  
  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the error for this field when user types
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };
  
  // Handle email preferences changes
  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setEmailPreferences(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };
  
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Only update if values have changed
      if (profileData.firstName !== user?.firstName || 
          profileData.lastName !== user?.lastName) {
        
        if (typeof updateProfile === 'function') {
          await updateProfile({
            firstName: profileData.firstName,
            lastName: profileData.lastName,
          });
          
          toast({
            title: "Profile Updated",
            description: "Your profile information has been saved successfully.",
          });
        } else {
          console.error('updateProfile is not a function');
          toast({
            title: "Error",
            description: "Could not update profile. Please try again later.",
            variant: "destructive",
          });
        }
      }
      
      // Save email preferences to backend
      // This is a placeholder - you'll need to implement this API endpoint
      try {
        await api.post('/api/auth/preferences', emailPreferences);
        toast({
          title: "Preferences Saved",
          description: "Your email preferences have been updated.",
        });
      } catch (error) {
        console.error('Failed to save email preferences:', error);
        // Don't show an error toast here as the profile might have been updated successfully
      }
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const validatePassword = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    
    let isValid = true;
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setPasswordErrors(errors);
    return isValid;
  };
  
  const handleUpdatePassword = async () => {
    // Validate passwords first
    if (!validatePassword()) return;
    
    try {
      setChangingPassword(true);
      
      const response = await api.patch('/api/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Reset form after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      
    } catch (error: any) {
      console.error('Failed to update password:', error);
      
      // Display specific error message from server if available
      if (error.response?.data?.message) {
        if (error.response.status === 401) {
          setPasswordErrors(prev => ({
            ...prev,
            currentPassword: error.response.data.message
          }));
        } else {
          toast({
            title: "Error",
            description: error.response.data.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-2">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-medium border-b">
                Settings
              </div>
              <div className="p-0">
                <button 
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-2 ${activeTab === 'profile' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <UserCog className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button 
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-2 ${activeTab === 'security' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('security')}
                >
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </button>
                <button 
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-red-50 border-red-100">
              <h3 className="text-red-600 font-medium flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4" />
                Danger Zone
              </h3>
              <p className="text-sm text-red-600/80 mb-3">
                Actions here cannot be undone. Please proceed with caution.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center gap-2" 
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">First Name</label>
                      <Input 
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">Last Name</label>
                      <Input 
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">Email</label>
                      <Input 
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email"
                        disabled
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
                    </div>
                    <div className="border rounded p-3 bg-gray-50">
                      <div className="text-xs text-gray-500">Role</div>
                      <div className="capitalize">{user?.role}</div>
                    </div>
                    <div className="border rounded p-3 bg-gray-50">
                      <div className="text-xs text-gray-500">Email Verification</div>
                      <div className={user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                        {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Email Preferences</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="emailUpdates" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        checked={emailPreferences.emailUpdates}
                        onChange={handlePreferenceChange}
                      />
                      <label htmlFor="emailUpdates">
                        Email me about program updates and new features
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="emailReminders" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        checked={emailPreferences.emailReminders}
                        onChange={handlePreferenceChange}
                      />
                      <label htmlFor="emailReminders">
                        Send me workout and schedule reminders
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveChanges} 
                  disabled={saving || isLoading}
                  className="flex gap-2 items-center"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">Current Password</label>
                      <Input 
                        type="password" 
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">New Password</label>
                      <Input 
                        type="password" 
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                      )}
                      <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-500">Confirm New Password</label>
                      <Input 
                        type="password" 
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={changingPassword}
                  className="flex gap-2 items-center"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">App Notifications</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="programUpdates" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        defaultChecked
                      />
                      <label htmlFor="programUpdates">
                        Program updates and changes
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="workoutReminders" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        defaultChecked
                      />
                      <label htmlFor="workoutReminders">
                        Workout reminders
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="athleteActivity" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        defaultChecked
                      />
                      <label htmlFor="athleteActivity">
                        Athlete activity and progress
                      </label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Email Notifications</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="weeklyReports" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        defaultChecked
                      />
                      <label htmlFor="weeklyReports">
                        Weekly progress reports
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="accountAlerts" 
                        className="h-4 w-4 rounded border-gray-300 text-coach-primary focus:ring-coach-primary"
                        defaultChecked
                      />
                      <label htmlFor="accountAlerts">
                        Account alerts and security notices
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Notification Settings</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 