import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar, CheckCircle, Star, Award, TrendingUp, Clock, BarChart3, Loader2, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { workoutLogsService, achievementService } from '@/services/api';
import { WorkoutLog } from '@/types/workoutLog';
import { Achievement } from '@/types/achievement';

// Mapping from icon name string to actual Lucide component
const iconMap: { [key: string]: LucideIcon } = {
  Calendar,
  CheckCircle,
  Star,
  Award,
  TrendingUp,
  Clock,
  BarChart3,
};

// Mock data for training activity
const activityHistory = [
  { 
    id: '1', 
    date: '2024-04-01T10:30:00Z', 
    workout: 'Upper Body Focus', 
    program: 'Strength Building Program',
    duration: '45 minutes',
    completed: true,
    intensity: 'Medium',
    notes: 'Felt good, increased weight on bench press'
  },
  { 
    id: '2', 
    date: '2024-03-29T11:00:00Z', 
    workout: 'HIIT Session', 
    program: 'Endurance Builder',
    duration: '30 minutes',
    completed: true,
    intensity: 'Hard',
    notes: 'Tough session but completed all sets'
  },
  { 
    id: '3', 
    date: '2024-03-27T09:15:00Z', 
    workout: 'Lower Body Focus', 
    program: 'Strength Building Program',
    duration: '50 minutes',
    completed: true,
    intensity: 'Hard',
    notes: 'Legs feel stronger, added extra set of squats'
  },
  { 
    id: '4', 
    date: '2024-03-25T16:30:00Z', 
    workout: 'Recovery Day', 
    program: 'Strength Building Program',
    duration: '25 minutes',
    completed: true,
    intensity: 'Easy',
    notes: 'Light stretching and mobility work'
  },
  { 
    id: '5', 
    date: '2024-03-23T08:45:00Z', 
    workout: 'Upper Body Focus', 
    program: 'Strength Building Program',
    duration: '45 minutes',
    completed: true,
    intensity: 'Medium',
    notes: 'Good session, felt stronger than last time'
  }
];

const achievements = [
  { id: '1', title: 'Consistency Champion', description: 'Completed all workouts for 2 weeks straight', date: '2024-03-30', icon: Star },
  { id: '2', title: 'Early Riser', description: 'Completed 5 workouts before 8 AM', date: '2024-03-20', icon: Clock },
  { id: '3', title: 'Strength Milestone', description: 'Increased weights on all major lifts', date: '2024-03-15', icon: TrendingUp },
  { id: '4', title: 'Program Completer', description: 'Finished your first complete program', date: '2024-02-28', icon: CheckCircle }
];

// Helper function to get activity calendar data
const getCalendarData = (logs: WorkoutLog[]) => {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => {
    const hasActivity = logs.some(log => 
      log.completedAt && isSameDay(parseISO(String(log.completedAt)), day)
    );
    
    return { date: day, hasActivity };
  });
};

const AthleteActivity: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user) {
        setLoadingLogs(false);
        setLoadingAchievements(false);
        setError("User not authenticated.");
        return;
      }
      
      setLoadingLogs(true);
      setLoadingAchievements(true);
      setError(null);

      try {
        const fetchedLogs = await workoutLogsService.getMyWorkoutLogs();
        setLogs(fetchedLogs);
        setLoadingLogs(false);

        try {
          const fetchedAchievements = await achievementService.getMyAchievements();
          setAchievements(fetchedAchievements);
        } catch (achieveError) {
          console.error("Error fetching achievements:", achieveError);
          setError((prevError) => prevError ? `${prevError} Failed to load achievements.` : "Failed to load achievements.");
        } finally {
          setLoadingAchievements(false);
        }

      } catch (logError) {
        setError("Failed to load workout history."); 
        console.error("Error fetching athlete logs:", logError);
        setLoadingLogs(false);
        setLoadingAchievements(false);
      } 
    };

    fetchActivityData();
  }, [user]);

  const getRatingIndicator = (rating?: number) => {
    if (rating === undefined || rating === null) return null;
    const color = rating <= 2 ? 'bg-green-500' : rating <= 4 ? 'bg-yellow-500' : 'bg-red-500';
    return <span className={`inline-block h-3 w-3 rounded-full ${color}`} title={`Rating: ${rating}/5`} />;
  };
  
  const formatDuration = (minutes?: number): string => {
      if (minutes === undefined || minutes === null) return 'N/A';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calendarData = getCalendarData(logs);

  if (loadingLogs || loadingAchievements) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-coach-primary" />
        <span className="ml-2 text-lg">Loading activity...</span>
      </div>
    );
  }

  if (error && !logs.length && !achievements.length) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  const getIconComponent = (iconName?: string): LucideIcon | null => {
    if (!iconName) return null;
    return iconMap[iconName] || Award;
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Activity</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-coach-primary/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Workouts</p>
                <h3 className="text-2xl font-bold">{logs.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-primary/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-coach-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-coach-secondary/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Time</p>
                <h3 className="text-2xl font-bold">{logs.reduce((total, log) => total + (typeof log.duration === 'number' ? log.duration : 0), 0)} min</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-secondary/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-coach-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-coach-accent/20 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Workout</p>
                <h3 className="text-2xl font-bold">{logs.length > 0 ? Math.round(logs.reduce((total, log) => total + (typeof log.duration === 'number' ? log.duration : 0), 0) / logs.length) : 'N/A'} min</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-accent/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-coach-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Achievements</p>
                <h3 className="text-2xl font-bold">{achievements.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="history" className="mb-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="history" className="data-[state=active]:bg-coach-primary data-[state=active]:text-white">Workout History</TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-coach-secondary data-[state=active]:text-white">Activity Calendar</TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-coach-accent data-[state=active]:text-white">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <Card className="border-coach-primary/20 shadow-sm">
            <CardHeader className="bg-coach-primary/5">
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your completed workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No workout history yet.</p>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <Card key={log._id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{log.dayName || 'Workout'}</CardTitle>
                            <CardDescription>{log.regimenName || 'Training Plan'}</CardDescription>
                          </div>
                          <Badge variant="outline">
                            {log.completedAt ? format(parseISO(String(log.completedAt)), 'MMM d, yyyy') : 'Date N/A'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="font-medium">Time:</span> {typeof log.duration === 'number' ? formatDuration(log.duration) : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Intensity:</span> {log.intensity || 'N/A'}
                          </div>
                        </div>
                        {log.notes && (
                          <div className="mt-3 text-sm">
                            <span className="font-medium">Notes:</span> {log.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card className="border-coach-secondary/20 shadow-sm">
            <CardHeader className="bg-coach-secondary/5">
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Visual overview of your workout days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-sm font-medium text-gray-500">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarData.map((day, index) => (
                  <div 
                    key={index} 
                    className={`aspect-square flex items-center justify-center rounded-lg p-2 text-sm ${
                      day.hasActivity
                        ? 'bg-coach-secondary/20 text-coach-secondary font-medium' 
                        : 'text-gray-500 bg-gray-50'
                    }`}
                  >
                    {format(day.date, 'd')}
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-coach-secondary/20"></div>
                  <span className="text-sm text-gray-600">Workout Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements">
          <Card className="border-coach-accent/20 shadow-sm">
            <CardHeader className="bg-coach-accent/5">
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Milestones reached in your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                 <p className="text-center text-gray-500 py-4">No achievements earned yet. Keep working out!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map(achievement => {
                    const IconComponent = getIconComponent(achievement.iconName);
                    return (
                      <div key={achievement.id} className="border rounded-lg p-4 flex gap-4 hover:border-coach-accent/30 transition-colors">
                        {IconComponent && (
                          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <IconComponent className="h-6 w-6 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                          {achievement.achievedDate && (
                             <p className="text-xs text-gray-500 mt-2">
                               Achieved on {format(parseISO(String(achievement.achievedDate)), 'MMM d, yyyy')}
                             </p>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AthleteActivity; 