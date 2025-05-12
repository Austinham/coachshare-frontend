import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, isAfter, isBefore, isSameDay } from 'date-fns';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  ClipboardCheck, 
  Star, 
  ChevronRight, 
  BellRing,
  MessageSquare,
  UserCircle,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegimenType, ExerciseType } from '@/types/regimen';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from "@/components/ui/separator";
import { fetchApi } from '@/services/api';
import api from '@/services/api';
import { markNotificationRead, applyReadStatus } from '@/utils/notificationUtils';
import { markNotificationAsRead } from '@/services/notificationService';
import { getMyCoach, CoachProps } from '@/services/coachService';

// Define simplified type for mock data to avoid type errors
interface SimplifiedExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

interface SimplifiedDay {
  name: string;
  exercises: SimplifiedExercise[];
}

interface SimplifiedRegimen {
  _id: string;
  name: string;
  description: string;
  category: string;
  days: SimplifiedDay[];
}

const AthleteHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regimens, setRegimens] = useState<RegimenType[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [coachMessages, setCoachMessages] = useState<any[]>([]);
  const [myCoach, setMyCoach] = useState<CoachProps | null>(null);
  
  // Mock data for fallback
  const mockRegimens: SimplifiedRegimen[] = [
    {
      _id: "1",
      name: "Strength Building",
      description: "A regimen focused on building strength.",
      category: "Strength",
      days: [
        {
          name: "Monday",
          exercises: [
            { name: "Bench Press", sets: 3, reps: 10, weight: 135 },
            { name: "Squats", sets: 3, reps: 10, weight: 185 },
            { name: "Deadlifts", sets: 3, reps: 8, weight: 225 }
          ]
        },
        {
          name: "Wednesday",
          exercises: [
            { name: "Pull-ups", sets: 3, reps: 8 },
            { name: "Rows", sets: 3, reps: 10, weight: 135 },
            { name: "Shoulder Press", sets: 3, reps: 10, weight: 95 }
          ]
        },
        {
          name: "Friday",
          exercises: [
            { name: "Leg Press", sets: 3, reps: 12, weight: 225 },
            { name: "Lunges", sets: 3, reps: 10, weight: 65 },
            { name: "Calf Raises", sets: 3, reps: 15, weight: 135 }
          ]
        }
      ]
    }
  ];

  const mockProgress = [
    { date: "2023-03-01", completed: true, streak: 1 },
    { date: "2023-03-02", completed: true, streak: 2 },
    { date: "2023-03-03", completed: true, streak: 3 },
    { date: "2023-03-05", completed: true, streak: 1 },
    { date: "2023-03-06", completed: true, streak: 2 },
  ];

  const mockNotifications = [
    { 
      _id: "1", 
      title: "New workout assigned", 
      message: "Your coach has assigned you a new workout.", 
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
      read: false 
    },
    { 
      _id: "2", 
      title: "Workout reminder", 
      message: "Don't forget your chest day workout today!", 
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
      read: true 
    }
  ];

  const mockCoachMessages = [
    {
      _id: "1",
      coachName: "Sarah Johnson",
      message: "Great progress on your deadlifts! Let's focus on proper form next session.",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "2",
      coachName: "Sarah Johnson",
      message: "I've updated your nutrition plan based on your latest results. Check it out!",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Fetching data for athlete:', user?.name);
      
      try {
        // Fetch athlete's coach
        const coachData = await getMyCoach();
        setMyCoach(coachData);
        
        // Fetch regimens - this endpoint exists
        console.log('Attempting to fetch athlete regimens...');
        const response = await api.get<any>('/regimens/athlete');
        const regimensArray = response.data?.data?.regimens;
        const fetchedRegimens = Array.isArray(regimensArray) ? regimensArray : [];
        
        console.log('Regimens data received:', fetchedRegimens);
        
        // If athlete has regimens but no coach, re-fetch coach data
        // This handles the case where a program was just assigned but coach relationship hasn't updated
        if (fetchedRegimens.length > 0 && !coachData) {
          console.log('Athlete has regimens but no coach, re-fetching coach data...');
          setTimeout(async () => {
            const refreshedCoachData = await getMyCoach();
            if (refreshedCoachData) {
              console.log('Updated coach data received:', refreshedCoachData);
              setMyCoach(refreshedCoachData);
            }
          }, 1000);
        }
        
        // Log full structure of first regimen to see days array
        if (fetchedRegimens.length > 0) {
          const firstRegimen = fetchedRegimens[0];
          console.log('Full first regimen structure:', JSON.stringify(firstRegimen, null, 2));
          console.log('Days property type:', typeof firstRegimen.days);
          console.log('Days property value:', firstRegimen.days);
          
          if (Array.isArray(firstRegimen.days)) {
            console.log('First day sample:', firstRegimen.days[0]);
          }
        }
        
        // Create default week schedule for regimens without days
        const regimensWithDays = fetchedRegimens.map(regimen => {
          // If regimen doesn't have days array or it's empty, create a default schedule
          if (!regimen.days || !Array.isArray(regimen.days) || regimen.days.length === 0) {
            console.log(`Regimen ${regimen.name} has no days array, creating default schedule`);
            
            // Get current day to make sure we include it in the schedule
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = dayNames[dayOfWeek];
            console.log(`Today is ${todayName}, making sure to include it in the schedule`);
            
            // Create a default schedule based on the regimen's name
            const defaultDays = [];
            
            if (regimen.name.toLowerCase().includes('sprint')) {
              // For sprint regimens, default to Tuesday and Thursday
              defaultDays.push(
                {
                  name: 'Tuesday',
                  exercises: [{ name: 'Sprint Intervals', sets: 5, reps: 10 }]
                },
                {
                  name: 'Thursday',
                  exercises: [{ name: 'Speed Work', sets: 3, reps: 8 }]
                }
              );
            } else if (regimen.name.toLowerCase().includes('outdoor')) {
              // For outdoor regimens, default to Monday, Wednesday, Friday
              defaultDays.push(
                {
                  name: 'Monday',
                  exercises: [{ name: 'Outdoor Run', sets: 1, reps: 1 }]
                },
                {
                  name: 'Wednesday',
                  exercises: [{ name: 'Hill Training', sets: 3, reps: 5 }]
                },
                {
                  name: 'Friday',
                  exercises: [{ name: 'Trail Run', sets: 1, reps: 1 }]
                }
              );
            } else {
              // Default full-body workouts on Monday, Wednesday, Friday
              defaultDays.push(
                {
                  name: 'Monday',
                  exercises: [{ name: 'Full Body Workout', sets: 3, reps: 10 }]
                },
                {
                  name: 'Wednesday',
                  exercises: [{ name: 'Core Training', sets: 3, reps: 15 }]
                },
                {
                  name: 'Friday',
                  exercises: [{ name: 'Strength Session', sets: 4, reps: 8 }]
                }
              );
            }
            
            // Always add a workout for today if it doesn't exist
            const hasTodayWorkout = defaultDays.some(day => 
              day.name.toLowerCase() === todayName.toLowerCase());
            
            if (!hasTodayWorkout) {
              console.log(`Adding a workout for today (${todayName})`);
              defaultDays.push({
                name: todayName,
                exercises: [
                  { 
                    name: `${regimen.name} - ${todayName} Workout`, 
                    sets: 3, 
                    reps: 10 
                  }
                ]
              });
            }
            
            // Log the default days we've created
            console.log(`Created default days for ${regimen.name}:`, defaultDays);
            
            return { ...regimen, days: defaultDays };
          }
          return regimen;
        });
        
        console.log('Processed regimens with days:', regimensWithDays);
        setRegimens(regimensWithDays);
        
        // Generate notifications based on regimen assignments
        const generatedNotifications = [];
        
        // Sort regimens by createdAt date (newest first)
        const sortedRegimens = [...regimensWithDays].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Create notifications for each regimen assignment
        sortedRegimens.forEach((regimen, index) => {
          const dateStr = regimen.createdAt || regimen.updatedAt || new Date().toISOString();
          const assignmentDate = new Date(dateStr);
          
          // Create notification
          generatedNotifications.push({
            _id: `notification-${regimen._id || regimen.id}`,
            title: "New Program Assigned",
            message: `"${regimen.name}" has been assigned to you.`,
            date: assignmentDate.toISOString(),
            read: false
          });
          
          // For recently created regimens (first one), add another notification
          if (index === 0) {
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - assignmentDate.getTime()) / (1000 * 3600 * 24));
            
            if (daysDiff < 7) {
              // Add a reminder notification for newer assignments
              generatedNotifications.push({
                _id: `notification-reminder-${regimen._id || regimen.id}`,
                title: "Workout Reminder",
                message: `Don't forget to check your new "${regimen.name}" program.`,
                date: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                read: false
              });
            }
          }
        });
        
        console.log('Generated notifications:', generatedNotifications);
        
        // Apply any previously saved read status
        const updatedNotifications = applyReadStatus(generatedNotifications);
        setNotifications(updatedNotifications);
        
        // Set empty arrays for other endpoints that don't exist yet
        console.log('Setting empty arrays for data not available via API yet');
        setProgress([]);
        setCoachMessages([]);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error
        setRegimens([]);
        setProgress([]);
        setNotifications([]);
        setCoachMessages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const getTodaysWorkouts = () => {
    if (!regimens.length) return [];
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dayOfWeek];
    const todayDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log('Today is:', todayName, today.toDateString(), '- looking for workouts on this day');
    console.log('Today date is:', todayDate);
    
    const workouts = [];
    
    for (const regimen of regimens) {
      console.log(`Checking regimen "${regimen.name}" for days:`, regimen.days);
      
      if (!regimen.days || !Array.isArray(regimen.days)) {
        console.log(`Regimen ${regimen.name} has no days array`);
        continue;
      }
      
      for (const day of regimen.days) {
        console.log(`Examining day in regimen "${regimen.name}":`, day);
        console.log(`Day name: "${day.name}", Day date: "${day.date}", Today: "${todayName}"`);
        
        let isMatch = false;
        
        // Method 1: Check if day name starts with today's day name (e.g., "Thursday, Apr 3" starts with "Thursday")
        if (day.name && typeof day.name === 'string') {
          const dayNameLower = day.name.toLowerCase().trim();
          const todayNameLower = todayName.toLowerCase().trim();
          
          console.log(`Checking if "${dayNameLower}" starts with "${todayNameLower}"`);
          if (dayNameLower.startsWith(todayNameLower)) {
            console.log(`MATCH FOUND via day name prefix!`);
            isMatch = true;
          }
        }
        
        // Method 2: Check if the date matches today's date (for date-based workouts)
        if (!isMatch && day.date) {
          const dayDateStr = day.date ? (typeof day.date === 'string' ? day.date : String(day.date)) : '';
          console.log(`Checking if date "${dayDateStr}" matches today's date "${todayDate}"`);
          
          if (dayDateStr === todayDate) {
            console.log(`MATCH FOUND via date match!`);
            isMatch = true;
          }
          
          // Also check if the date is today's date in YYYY-MM-DD format
          const now = new Date();
          const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          if (dayDateStr === formattedDate) {
            console.log(`MATCH FOUND via formatted date match!`);
            isMatch = true;
          }
        }
        
        // Add workout if it matches
        if (isMatch) {
          console.log(`Adding workout for ${regimen.name} on ${day.name}`);
          workouts.push({
            regimenId: regimen._id || regimen.id,
            regimenName: regimen.name,
            day
          });
        }
      }
    }
    
    console.log('Final today\'s workouts:', workouts);
    return workouts;
  };

  const getUpcomingWorkouts = () => {
    if (!regimens.length) return [];
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const upcomingDays = [];
    for (let i = 1; i <= 3; i++) {
      const upcomingDayIndex = (dayOfWeek + i) % 7;
      upcomingDays.push(dayNames[upcomingDayIndex]);
    }
    
    console.log('Looking for upcoming days:', upcomingDays);
    
    const workouts = [];
    
    for (const regimen of regimens) {
      if (!regimen.days || !Array.isArray(regimen.days)) {
        continue;
      }
      
      for (const day of regimen.days) {
        // Get the day name for matching
        let matchedDayIndex = -1;
        
        if (day.name && typeof day.name === 'string') {
          const dayNameLower = day.name.toLowerCase().trim();
          
          // Check if day name starts with any of the upcoming days
          for (let i = 0; i < upcomingDays.length; i++) {
            const upcomingDayLower = upcomingDays[i].toLowerCase().trim();
            console.log(`Checking if "${dayNameLower}" starts with "${upcomingDayLower}"`);
            
            if (dayNameLower.startsWith(upcomingDayLower)) {
              console.log(`UPCOMING MATCH FOUND! ${day.name} matches ${upcomingDays[i]}`);
              matchedDayIndex = i;
              break;
            }
          }
          
          if (matchedDayIndex !== -1) {
            workouts.push({
              regimenId: regimen._id || regimen.id,
              regimenName: regimen.name,
              day,
              dayOffset: matchedDayIndex + 1
            });
          }
        }
        
        // Also check by date (if present)
        if (matchedDayIndex === -1 && day.date) {
          const dayDate = new Date(day.date);
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(today.getDate() + 2);
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(today.getDate() + 3);
          
          // Check if date is in the next 3 days
          if (dayDate.toDateString() === tomorrow.toDateString()) {
            console.log(`UPCOMING MATCH by date: ${day.name} is tomorrow`);
            workouts.push({
              regimenId: regimen._id || regimen.id,
              regimenName: regimen.name,
              day,
              dayOffset: 1
            });
          } else if (dayDate.toDateString() === twoDaysFromNow.toDateString()) {
            console.log(`UPCOMING MATCH by date: ${day.name} is in 2 days`);
            workouts.push({
              regimenId: regimen._id || regimen.id,
              regimenName: regimen.name,
              day,
              dayOffset: 2
            });
          } else if (dayDate.toDateString() === threeDaysFromNow.toDateString()) {
            console.log(`UPCOMING MATCH by date: ${day.name} is in 3 days`);
            workouts.push({
              regimenId: regimen._id || regimen.id,
              regimenName: regimen.name,
              day,
              dayOffset: 3
            });
          }
        }
      }
    }
    
    // Sort by day offset (closest days first)
    return workouts.sort((a, b) => a.dayOffset - b.dayOffset);
  };

  const getCompletion = (regimenId: string) => {
    const regimenProgress = progress.find(p => p.regimenId === regimenId);
    if (!regimenProgress) return 0;
    return Math.round((regimenProgress.completed / regimenProgress.total) * 100);
  };

  const getOverallProgress = () => {
    const total = progress.reduce((sum, item) => sum + item.total, 0);
    const completed = progress.reduce((sum, item) => sum + item.completed, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const todaysWorkouts = getTodaysWorkouts();
  const upcomingWorkouts = getUpcomingWorkouts();
  
  // Calculate stats based on actual data
  const totalWorkouts = regimens.length > 0 
    ? regimens.reduce((sum, regimen) => sum + regimen.days.length, 0)
    : 0;
  const longestStreak = progress?.length ? Math.max(...progress.map(p => p.streak || 0), 0) : 0;

  // Mark a notification as read
  const handleMarkAsRead = async (id: string) => {
    // Update UI immediately for better user experience
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
    
    // Update server
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // If error, we still keep the UI updated since it's cached locally
    }
  };

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    handleMarkAsRead(id);
    // In a real app, you would navigate to the relevant page based on notification type
    // For now, we just mark it as read
  };

  // Loading skeleton components
  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
        <div className="mb-6">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-coach-primary/80 to-coach-primary mb-6 shadow-md border-0">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.name || 'Athlete'}!</h1>
              <p className="text-white/90">Ready for today's workout? Your progress is looking great.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Coach Prompt - Show this if athlete doesn't have a coach */}
      {!user?.coachId && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <UserCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Coach assignment coming soon</h3>
                  <p className="text-blue-700">Personalized coaching features will be available in a future update.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-coach-primary/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                <h3 className="text-2xl font-bold">{getOverallProgress()}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-coach-primary" />
              </div>
            </div>
            <Progress className="mt-4 bg-coach-primary/20" value={getOverallProgress()} />
          </CardContent>
        </Card>

        <Card className="border-coach-secondary/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Programs</p>
                <h3 className="text-2xl font-bold">{regimens.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-secondary/20 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-coach-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-coach-accent/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Workouts</p>
                <h3 className="text-2xl font-bold">{totalWorkouts}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-accent/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-coach-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Longest Streak</p>
                <h3 className="text-2xl font-bold">{longestStreak} days</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Today's Workouts */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-coach-primary/10">
            <CardHeader className="bg-coach-primary/5">
              <CardTitle className="flex items-center">
                <ClipboardCheck className="mr-2 h-5 w-5 text-coach-primary" />
                Today's Workouts
              </CardTitle>
              <CardDescription>
                {todaysWorkouts.length > 0 
                  ? "Your scheduled workouts for today" 
                  : "No workouts scheduled for today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : todaysWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {todaysWorkouts.map((workout, index) => (
                    <div key={`${workout.regimenId}-${index}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">{workout.regimenName}</h3>
                        <Badge variant="outline">{workout.day.name}</Badge>
                      </div>
                      <div className="space-y-2">
                        {workout.day.exercises.map((exercise, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span>{exercise.name}</span>
                            <span>{exercise.sets} sets × {exercise.reps} reps</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground mb-4">No workouts scheduled for today</p>
                  <Button variant="outline" onClick={() => navigate('/app/athlete/regimens')}>
                    View All Regimens
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Coach Feedback */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Coach Feedback</CardTitle>
              <CardDescription>
                Recent messages from your coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full mb-3" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : coachMessages.length > 0 ? (
                <div className="space-y-4">
                  {coachMessages.slice(0, 2).map((message) => (
                    <div key={message._id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCircle className="h-5 w-5" />
                        <span className="font-medium">{message.coachName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(message.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted-foreground mb-4">No recent messages from your coach</p>
                </div>
              )}
            </CardContent>
            {coachMessages.length > 0 && (
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/app/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View all messages
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* My Coaches Section */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>My Coach</CardTitle>
              <CardDescription>
                Your current coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-24 w-full mb-3" />
                </>
              ) : (
                <div>
                  {myCoach ? (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          {myCoach.avatarUrl ? (
                            <img 
                              src={myCoach.avatarUrl} 
                              alt={`${myCoach.firstName || 'Coach'} ${myCoach.lastName || ''}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-coach-primary/20 flex items-center justify-center">
                              <UserCircle className="h-10 w-10 text-coach-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {(myCoach.firstName || 'Coach') + ' ' + (myCoach.lastName || '')}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {myCoach.specialties && myCoach.specialties.length > 0 ? (
                              myCoach.specialties.map((specialty, i) => (
                                <Badge key={i} variant="outline" className="bg-coach-primary/10">
                                  {specialty}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="bg-coach-primary/10">
                                General Fitness
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            {myCoach.experience ? `${myCoach.experience} of experience` : ''}
                            {myCoach.rating ? ` • ${myCoach.rating.toFixed(1)} rating` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <p className="text-muted-foreground mb-4">Coach assignment feature coming soon</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/app/athlete/my-coaches')}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                View My Coaches
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Upcoming Workouts */}
          <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow border-coach-secondary/10">
            <CardHeader className="bg-coach-secondary/5">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-coach-secondary" />
                Upcoming Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full mb-3" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : upcomingWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingWorkouts.slice(0, 3).map((workout, index) => (
                    <div key={`${workout.regimenId}-${index}`} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">{workout.regimenName}</h3>
                        <Badge variant="outline" className="text-xs">{workout.day.name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {workout.day.exercises.length} exercises
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted-foreground text-sm">
                    No upcoming workouts scheduled
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="ghost" 
                className="w-full justify-center text-coach-secondary hover:bg-coach-secondary/10" 
                onClick={() => navigate('/app/athlete/regimens')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AthleteHome; 