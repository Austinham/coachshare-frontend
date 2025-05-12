import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isValid, isAfter, isBefore } from 'date-fns';
import { debounce } from 'lodash';
import {
  BarChart,
  LineChart,
  User,
  Calendar,
  ArrowLeft,
  Filter,
  Download,
  Clock,
  Dumbbell,
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Wind,
  Activity,
  Flame,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/services/api';
import { workoutLogsService } from '@/services/api';
import DataIsolationAlert from '@/components/DataIsolationAlert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Mock data interfaces
interface ExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  targetReps: number;
  actualReps: number;
  weight?: string;
  notes?: string;
  completed: boolean;
  completedAt: string;
}

interface WorkoutLog {
  id: string;
  _id: string;
  regimenId: string;
  regimenName: string;
  dayId: string;
  dayName: string;
  athleteId: { _id: string; firstName: string; lastName: string; } | string | null;
  athleteName?: string;
  athleteProfilePic?: string;
  rating: number;
  notes?: string;
  difficulty: string;
  completed: boolean;
  completedAt: string;
  duration: number;
  exercises: ExerciseLog[];
  isDirectlyCoached?: boolean;
  athleteIdString?: string | null;
}

interface Athlete {
  id: string;
  name: string;
  profilePic?: string;
  email: string;
  joinedAt: string;
}

// Helper functions
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-800';
    case 'Medium': return 'bg-blue-100 text-blue-800';
    case 'Hard': return 'bg-orange-100 text-orange-800';
    case 'Very Hard': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getRatingIndicator = (rating: number) => {
  if (rating <= 3) return { icon: Wind, color: 'text-green-500', text: 'Easy' };
  if (rating <= 7) return { icon: Activity, color: 'text-amber-500', text: 'Moderate' };
  return { icon: Flame, color: 'text-red-500', text: 'Challenging' };
};

const getCompletionPercentage = (log: WorkoutLog): number => {
  const totalExercises = log.exercises.length;
  const completedExercises = log.exercises.filter(e => e.completed).length;
  return totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const AthleteWorkoutLogs: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { athleteId } = useParams<{ athleteId: string }>();
  
  // Define the DateRangeFilter type BEFORE using it in state
  type DateRangeFilter = 'week' | 'month' | 'all' | { from: Date; to: Date };
  
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const lastAthleteIdRef = useRef(athleteId);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [logFilter, setLogFilter] = useState<'myAthletes' | 'all'>('myAthletes');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch('/api/athletes');
        if (!response.ok) {
          throw new Error('Failed to fetch athletes');
        }
        const data = await response.json();
        setAthletes(data);
      } catch (err) {
        setError('Failed to load athletes');
        console.error('Error fetching athletes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedAthlete) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/workout-logs?athleteId=${selectedAthlete}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workout logs');
        }
        const data = await response.json();
        setWorkoutLogs(data);
      } catch (err) {
        setError('Failed to load workout logs');
        console.error('Error fetching workout logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedAthlete]);
  
  // Sort logs by date (newest first)
  const sortedLogs = [...workoutLogs].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  // Update the date filtering logic
  const filteredLogs = useMemo(() => {
    return sortedLogs.filter(log => {
      const completedDate = new Date(log.completedAt);
      
      // Date range filtering
      if (dateRangeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedDate >= weekAgo;
      } else if (dateRangeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return completedDate >= monthAgo;
      } else if (dateRangeFilter === 'all') {
        return true;
      } else if (typeof dateRangeFilter === 'object') {
        return completedDate >= dateRangeFilter.from && completedDate <= dateRangeFilter.to;
      }
      
      return true;
    });
  }, [sortedLogs, dateRangeFilter]);
  
  // Calculate statistics for dashboard
  const calculateStats = () => {
    if (filteredLogs.length === 0) {
      return {
        totalWorkouts: 0,
        avgRating: 0,
        avgDuration: 0,
        completionRate: 0,
        topPerformer: null
      };
    }
    
    const totalWorkouts = filteredLogs.length;
    const avgRating = filteredLogs.reduce((sum, log) => sum + log.rating, 0) / totalWorkouts;
    const avgDuration = filteredLogs.reduce((sum, log) => sum + log.duration, 0) / totalWorkouts;
    
    // Calculate completion rate (% of exercises completed)
    const totalExercises = filteredLogs.reduce((sum, log) => sum + log.exercises.length, 0);
    const completedExercises = filteredLogs.reduce((sum, log) => 
      sum + log.exercises.filter(e => e.completed).length, 0);
    const completionRate = Math.round((completedExercises / totalExercises) * 100);
    
    // Find top performer
    const workoutsByAthlete: Record<string, number> = {};
    filteredLogs.forEach(log => {
      const key = log.athleteIdString;
      // Explicitly check if the key is a non-empty string before using it
      if (typeof key === 'string' && key) {
         workoutsByAthlete[key] = (workoutsByAthlete[key] || 0) + 1;
      }
    });

    let topPerformerId = '';
    let maxWorkouts = 0;
    Object.entries(workoutsByAthlete).forEach(([id, count]) => {
      if (count > maxWorkouts) {
        topPerformerId = id;
        maxWorkouts = count;
      }
    });
    const topPerformer = athletes.find(a => a.id === topPerformerId) || null;
    
    return {
      totalWorkouts,
      avgRating,
      avgDuration,
      completionRate,
      topPerformer
    };
  };
  
  const stats = calculateStats();
  
  const viewLogDetails = (log: WorkoutLog) => {
    setSelectedLog(log);
    setLogDetailOpen(true);
  };
  
  const handleExportCSV = () => {
    // In a real app, this would generate a CSV file for download
    toast({
      title: 'Export Started',
      description: 'Your data is being prepared for download',
    });
  };
  
  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full max-w-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="mb-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Athlete Workout Logs</h1>
          </div>
          <p className="text-gray-500">Monitor your athletes' workout completion and feedback</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => handleExportCSV()}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <DataIsolationAlert compact />
      
      {/* Filter controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="flex items-center border rounded-md px-2 py-1 bg-background">
                <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  placeholder="Search workouts..."
                  className="border-0 focus-visible:ring-0 h-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={logFilter} onValueChange={(value: 'myAthletes' | 'all') => setLogFilter(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter Logs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="myAthletes">My Athletes Only</SelectItem>
                  <SelectItem value="all">All Using My Regimens</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {typeof dateRangeFilter === 'object' ? (
                      <>
                        {format(dateRangeFilter.from, "LLL dd, y")}
                        {dateRangeFilter.to && (
                          <> - {format(dateRangeFilter.to, "LLL dd, y")}</>
                        )}
                      </>
                    ) : (
                      <span>
                        {dateRangeFilter === 'week' ? 'Last 7 Days' : 
                         dateRangeFilter === 'month' ? 'Last 30 Days' : 'All Time'}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Workouts</p>
                <h2 className="text-3xl font-bold">{stats.totalWorkouts}</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Dumbbell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <h2 className="text-3xl font-bold">{stats.avgRating.toFixed(1)}<span className="text-sm text-gray-500">/10</span></h2>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Duration</p>
                <h2 className="text-3xl font-bold">{Math.round(stats.avgDuration)}<span className="text-sm text-gray-500">min</span></h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <h2 className="text-3xl font-bold">{stats.completionRate}%</h2>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Logs table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Workout Logs</CardTitle>
          <CardDescription>
            {selectedAthlete === 'all' ? 'Showing logs for all athletes' : `Showing logs for ${athletes.find(a => a.id === selectedAthlete)?.name || 'selected athlete'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Athlete</TableHead>
                <TableHead>Workout</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <AlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-500">No workout logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => {
                  const ratingIndicator = getRatingIndicator(log.rating);
                  const RatingIcon = ratingIndicator.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.completedAt), 'MMM d, yyyy')}
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.completedAt), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.athleteProfilePic ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img 
                                src={log.athleteProfilePic} 
                                alt={log.athleteName || 'Athlete'}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <span>{log.athleteName || 'Athlete'}</span>
                          {log.isDirectlyCoached && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-200">
                              Directly Coached
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.dayName}</div>
                        <div className="text-xs text-gray-500">{log.regimenName}</div>
                        <Badge className={getDifficultyColor(log.difficulty)}>
                          {log.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={getCompletionPercentage(log)} className="h-2 w-24" />
                        <div className="text-xs text-gray-500 mt-1">
                          {log.exercises.filter(e => e.completed).length}/{log.exercises.length} exercises
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <RatingIcon className={`h-4 w-4 ${ratingIndicator.color}`} />
                          <span className="font-medium">{log.rating}/10</span>
                        </div>
                        <div className="text-xs text-gray-500">{ratingIndicator.text}</div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDuration(log.duration)}</div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewLogDetails(log)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Workout log details dialog */}
      <Dialog open={logDetailOpen} onOpenChange={setLogDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workout Log Details</DialogTitle>
            {selectedLog && (
              <DialogDescription>
                {format(new Date(selectedLog.completedAt), 'EEEE, MMMM d, yyyy')} • {selectedLog.athleteName || 'Athlete'}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-500">Workout</h3>
                      <p className="font-semibold mt-1">{selectedLog.dayName}</p>
                      <p className="text-xs text-gray-500">{selectedLog.regimenName}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className={`h-3 w-3 rounded-full ${selectedLog.rating <= 3 ? 'bg-green-500' : selectedLog.rating <= 7 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <p className="font-semibold">{selectedLog.rating}/10</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedLog.rating <= 3 ? 'Easy' : selectedLog.rating <= 7 ? 'Moderate' : 'Challenging'}
                      </p>
                      <Badge className={getDifficultyColor(selectedLog.difficulty)}>
                        {selectedLog.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                      <p className="font-semibold mt-1">{formatDuration(selectedLog.duration)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(selectedLog.completedAt), 'h:mm a')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {selectedLog.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Athlete Notes</h3>
                    <p className="text-gray-700">"{selectedLog.notes}"</p>
                  </CardContent>
                </Card>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Exercise Details</h3>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exercise</TableHead>
                        <TableHead className="text-center">Sets</TableHead>
                        <TableHead className="text-center">Target</TableHead>
                        <TableHead className="text-center">Actual</TableHead>
                        <TableHead className="text-center">Weight</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLog.exercises.map(exercise => (
                        <TableRow key={exercise.id}>
                          <TableCell className="font-medium">
                            {exercise.exerciseName}
                          </TableCell>
                          <TableCell className="text-center">{exercise.sets}</TableCell>
                          <TableCell className="text-center">{exercise.targetReps}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full ${exercise.actualReps >= exercise.targetReps ? 'bg-green-500' : 'bg-orange-500'}`} />
                              <span className={exercise.actualReps >= exercise.targetReps ? 'text-green-600' : 'text-orange-600'}>
                                {exercise.actualReps}/{exercise.targetReps}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {exercise.weight || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {exercise.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setLogDetailOpen(false)}
                >
                  Close
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AthleteWorkoutLogs; 