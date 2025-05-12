import React, { useState, useEffect, useRef } from 'react';
import { format, isAfter, isBefore, isSameDay, isToday } from 'date-fns';
import { 
  CalendarIcon, 
  ClipboardCheck, 
  Dumbbell, 
  Filter, 
  Search, 
  Star, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Timer,
  ChevronsUpDown
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
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import RegimenListView from '@/components/regimen/RegimenListView';
import RegimenTableView from '@/components/regimen/RegimenTableView';
import { RegimenType } from '@/types/regimen';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { regimenService, userService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

const IntensityIndicator: React.FC<{ intensity: string }> = ({ intensity }) => {
  const colorClass = {
    'Easy': 'bg-green-50 text-green-700',
    'Medium': 'bg-blue-50 text-blue-700',
    'Hard': 'bg-red-50 text-red-700',
    'Rest': 'bg-slate-50 text-slate-700',
    'General': 'bg-purple-50 text-purple-700'
  }[intensity] || 'bg-purple-50 text-purple-700';

  return (
    <Badge className={`${colorClass} ${intensity === 'Rest' ? 'text-slate-700' : 'text-gray-700'}`}>
      {intensity}
    </Badge>
  );
};

// Define structure for the log payload exercise data
interface LogExerciseData {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight: string;
  duration: number;
  completed: boolean;
  notes?: string;
}

// Define structure for the log payload
interface LogPayload {
  athleteId: string;
  regimenId: string;
  regimenName: string;
  dayId: string;
  dayName: string;
  rating: number;
  notes: string;
  difficulty: string;
  completed: boolean;
  completedAt: string;
  duration: number; // Overall workout duration (placeholder for now)
  exercises: LogExerciseData[];
  sharedWith: string[];
}

const AthleteRegimens: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedView, setSelectedView] = useState<'list' | 'calendar' | 'table'>('calendar');
  const [selectedRegimenId, setSelectedRegimenId] = useState<string | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [regimens, setRegimens] = useState<RegimenType[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Workout logging state
  const [logWorkoutOpen, setLogWorkoutOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<{day: any, regimen: any} | null>(null);
  const [workoutRating, setWorkoutRating] = useState<number>(5);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [coachesToShareWith, setCoachesToShareWith] = useState<string[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<{id: string, name: string}[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Workout session state
  const [workoutSessionActive, setWorkoutSessionActive] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<{day: any, regimen: any} | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseActualReps, setExerciseActualReps] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [exerciseResults, setExerciseResults] = useState<Record<string, any>>({});

  // <<< Add state for the data to be logged >>>
  const [logPayload, setLogPayload] = useState<Partial<LogPayload> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        console.log('Fetching athlete regimens data...');
        // Fetch regimens using the API service (ensure service function exists or use api.get)
        // Option 1: Use regimenService if a specific function exists
        // const fetchedRegimens = await regimenService.getAthleteRegimens(); // Assuming this function exists and returns RegimenType[]
        
        // Option 2: Use api.get directly (more likely based on previous code)
        const response = await api.get<any>('/regimens/athlete'); // Uses configured api instance with auth
        
        // Correctly extract the nested array from the expected structure
        const fetchedRegimens = response.data?.data?.regimens;
        
        console.log('Regimens data received:', fetchedRegimens);
        // Ensure we are setting an array
        if (Array.isArray(fetchedRegimens)) {
            setRegimens(fetchedRegimens);
        } else {
            console.warn('[AthleteRegimens] Expected an array in response.data.data.regimens, but received:', response.data);
            setRegimens([]); // Set empty array if structure is wrong or data is not array
        }
        
        // No endpoint for progress yet, set empty array
        console.log('No API endpoint available for progress data yet');
        setProgress([]);
      } catch (error) {
        console.error('Error fetching athlete data:', error);
        toast({ title: "Error Fetching Regimens", description: "Could not load your assigned regimens.", variant: "destructive" });
        setRegimens([]); // Set empty array on error
        setProgress([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Removed user dependency for initial fetch, as auth is handled by api instance

  useEffect(() => {
    const fetchAndSetCoaches = async () => {
      const currentCoaches = (user as any)?.coaches;
      const primaryCoachId = (user as any)?.primaryCoachId;
      
      if (user && currentCoaches && Array.isArray(currentCoaches)) { // Ensure currentCoaches is an array
        setLoadingCoaches(true);
        let coachList: { id: string; name: string }[] = [];
        const rawCoaches = currentCoaches;

        if (rawCoaches.length > 0) {
          const firstCoach = rawCoaches[0];
          if (typeof firstCoach === 'object' && firstCoach !== null && firstCoach._id && firstCoach.firstName) {
            // Coaches are already populated objects
            console.log("Processing coaches from user object directly");
            coachList = rawCoaches.map((coach: any) => ({
              id: coach._id,
              name: `${coach.firstName || 'Coach'} ${coach.lastName || ''}`.trim()
            })).filter((c: any) => c && c.id);
          } else if (typeof firstCoach === 'string') {
             // Coaches are just IDs, need to fetch details
            console.log("Fetching coach details for IDs:", rawCoaches);
            const coachIds = rawCoaches.filter((id: any) => typeof id === 'string');
            if (coachIds.length > 0) {
                try {
                    const coachDetails = await userService.getUsersByIds(coachIds);
                    // *** Add check here: Ensure coachDetails is an array ***
                    if (Array.isArray(coachDetails)) { 
                        coachList = coachDetails.map((coach: any) => ({
                          id: coach._id,
                          name: `${coach.firstName || 'Coach'} ${coach.lastName || ''}`.trim()
                        })).filter((c: any) => c && c.id);
                    } else {
                        console.warn("userService.getUsersByIds did not return an array", coachDetails);
                        coachList = []; // Default to empty list if API returns wrong format
                    }
                } catch (fetchError) {
                    console.error("Error fetching coach details in fetchAndSetCoaches:", fetchError);
                    coachList = []; // Default to empty list on fetch error
                }
            } else {
                 coachList = []; // No valid IDs to fetch
            }
          } else {
             console.warn("Unexpected format for user.coaches", rawCoaches);
             coachList = []; // Default to empty list on unexpected format
          }
        }
        
        setAvailableCoaches(coachList);

        // Pre-select primary coach
        if (primaryCoachId && coachList.some(c => c.id === primaryCoachId)) {
          setCoachesToShareWith([primaryCoachId]);
        } else {
          setCoachesToShareWith([]);
        }
        setLoadingCoaches(false);
      } else {
        setAvailableCoaches([]);
        setCoachesToShareWith([]);
      }
    };

    fetchAndSetCoaches();
  }, [user]); // Depend on user object

  // <<< useEffect to load current exercise data into inputs >>>
  useEffect(() => {
    if (workoutSessionActive && activeWorkout && activeWorkout.day.exercises.length > currentExerciseIndex) {
      const currentExercise = activeWorkout.day.exercises[currentExerciseIndex];
      const exerciseId = currentExercise.id || currentExercise._id;
      const existingResult = exerciseResults[exerciseId] || {}; // Get saved data or empty object
      
      // Set local state from saved results or defaults
      setExerciseWeight(existingResult.weight || '');
      setExerciseActualReps(existingResult.actualReps || '');
      setExerciseNotes(existingResult.notes || '');
    }
  }, [currentExerciseIndex, workoutSessionActive, activeWorkout, exerciseResults]); // Rerun when index or results change

  const toggleExerciseExpand = (dayId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const filteredRegimens = Array.isArray(regimens) 
    ? regimens.filter(regimen => {
    return regimen.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  const getTodaysWorkouts = () => {
    const today = new Date();
    const workouts = [];

    for (const regimen of regimens) {
      for (const day of regimen.days) {
        if (isSameDay(new Date(day.date), today)) {
          workouts.push({ day, regimen });
        }
      }
    }
    
    return workouts;
  };

  const getUpcomingWorkouts = () => {
    const today = new Date();
    const workouts = [];

    for (const regimen of regimens) {
      for (const day of regimen.days) {
        const dayDate = new Date(day.date);
        if (isAfter(dayDate, today) && isBefore(dayDate, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))) {
          workouts.push({ day, regimen, date: dayDate });
        }
      }
    }
    
    workouts.sort((a, b) => a.date.getTime() - b.date.getTime());
    return workouts;
  };

  const getCompletion = (regimenId: string) => {
    const regimenProgress = progress.find(p => p.regimenId === regimenId);
    if (!regimenProgress) return 0;
    return Math.round((regimenProgress.completed / regimenProgress.total) * 100);
  };

  const selectedRegimen = selectedRegimenId 
    ? regimens.find(r => r.id === selectedRegimenId) 
    : null;

  const todaysWorkouts = getTodaysWorkouts();
  const upcomingWorkouts = getUpcomingWorkouts();

  // Handle log workout - Now accepts pre-formatted exercise data
  const openLogWorkout = (
      workout: {day: any, regimen: any}, 
      loggedExercises: LogExerciseData[] // <<< Accept formatted exercises
    ) => {
    setCurrentWorkout(workout); // Still needed for Dialog Title etc.
    setWorkoutRating(5);
    setWorkoutNotes('');
    
    // Prepare initial log payload
    const athleteId = (user as any)?._id || (user as any)?.id;
    setLogPayload({
        // Pre-fill basic info
        athleteId: athleteId || undefined, // May be undefined initially
        regimenId: String(workout.regimen?.id || workout.regimen?._id || ''),
        regimenName: workout.regimen.name,
        dayId: String(workout.day?.id || workout.day?._id || ''),
        dayName: workout.day.name || 'Workout Day',
        difficulty: workout.day.intensity || 'Medium',
        completed: true, // Assume completed if logging
        completedAt: new Date().toISOString(),
        duration: 45, // Placeholder duration
        sharedWith: (user as any)?.primaryCoachId && availableCoaches.some(c => c.id === (user as any)?.primaryCoachId) 
                      ? [(user as any).primaryCoachId] 
                      : [], // Initial sharing state
        // <<< Set exercises from argument >>>
        exercises: loggedExercises 
    });
    
    setLogWorkoutOpen(true);
  };

  const submitWorkoutLog = async () => {
    setLoggingWorkout(true);
    
    // 1. Check if logPayload exists
    if (!logPayload) {
        toast({ title: "Error", description: "No workout data prepared for logging.", variant: "destructive" });
        setLoggingWorkout(false);
        return;
    }
    
    // 2. Get athlete ID from context (or payload if already set)
    const athleteId = logPayload.athleteId || (user as any)?._id || (user as any)?.id;
    if (!athleteId) {
        toast({ title: "Error", description: "Could not identify athlete. Please log in again.", variant: "destructive" });
        setLoggingWorkout(false);
        return; 
    }

    // 3. Construct the final payload using data from logPayload state
    //    and the current dialog state (rating, notes, coaches)
    const finalPayload: LogPayload = {
        ...logPayload, // Spread existing data (regimenId, dayId, exercises etc.)
        athleteId: athleteId,
        rating: workoutRating, // Get from dialog state
        notes: workoutNotes, // Use the OVERALL notes from dialog state
        sharedWith: coachesToShareWith, // Get from dialog state
        // Ensure all required fields are present
        regimenId: logPayload.regimenId || '',
        regimenName: logPayload.regimenName || '',
        dayId: logPayload.dayId || '',
        dayName: logPayload.dayName || '',
        difficulty: logPayload.difficulty || 'Medium',
        completed: logPayload.completed ?? true,
        completedAt: logPayload.completedAt || new Date().toISOString(),
        duration: logPayload.duration || 45,
        exercises: logPayload.exercises?.map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration,
            completed: ex.completed,
            notes: ex.notes || ''
        })) || [],
    };
    
     // Basic validation on final payload
    if (!finalPayload.regimenId || !finalPayload.dayId) {
        toast({ title: "Error", description: "Missing critical regimen or day information.", variant: "destructive" });
        setLoggingWorkout(false);
        return; 
    }

    try {
        console.log("Submitting final workout log payload:", finalPayload);

        // Make API call with the final payload
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/workout-logs`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(finalPayload) // <<< Send finalPayload
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Workout log submitted successfully:', result);
        toast({ title: "Success", description: "Workout logged successfully!" });
        
        // Clear the log payload state
        setLogPayload(null);
        
    } catch (error: any) {
        console.error("Error submitting workout log:", error);
        toast({ title: "Error", description: `Failed to log workout: ${error.message}`, variant: "destructive" });
    } finally {
      setLoggingWorkout(false);
      setLogWorkoutOpen(false);
    }
  };

  // Handle start workout
  const startWorkout = (workout: {day: any, regimen: any}) => {
    setActiveWorkout(workout);
    setCurrentExerciseIndex(0);
    setCompletedExercises({});
    setWorkoutSessionActive(true);
    setExerciseResults({});
    setRestTimerActive(false);
    setRestTimeRemaining(0);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Handle exercise completion - reset local inputs after saving results
  const completeExercise = (exerciseId: string) => {
    // Save the current exercise data (current logic uses local state)
    if (activeWorkout) {
      const currentExercise = activeWorkout.day.exercises[currentExerciseIndex];
      
      setExerciseResults({
        ...exerciseResults,
        [exerciseId]: {
          weight: exerciseWeight, 
          actualReps: exerciseActualReps, 
          notes: exerciseNotes,
          completedAt: new Date().toISOString()
        }
      });
      
      // Mark as completed
      setCompletedExercises({
        ...completedExercises,
        [exerciseId]: true
      });
      
      // Reset local inputs for next exercise
      setExerciseWeight('');
      setExerciseActualReps('');
      setExerciseNotes('');
      
      // Start rest timer if not the last exercise
      if (currentExerciseIndex < activeWorkout.day.exercises.length - 1) {
        const nextExercise = activeWorkout.day.exercises[currentExerciseIndex + 1];
        const restTime = parseRestInterval(nextExercise.restInterval);
        
        if (restTime > 0) {
          setRestTimeRemaining(restTime);
          setRestTimerActive(true);
          
          timerIntervalRef.current = window.setInterval(() => {
            setRestTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(timerIntervalRef.current as number);
                setRestTimerActive(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
      
      // Move to next exercise or finish
      if (currentExerciseIndex < activeWorkout.day.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        toast({
          title: "Workout Completed!",
          description: "You can now end the session and log your workout.",
        });
      }
    }
  };

  // Helper function to parse rest interval (MM:SS format) to seconds
  const parseRestInterval = (restInterval: string): number => {
    if (!restInterval) return 0;
    
    const parts = restInterval.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    
    return minutes * 60 + seconds;
  };

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Skip rest timer
  const skipRestTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRestTimerActive(false);
    setRestTimeRemaining(0);
  };

  // End workout session - passes formatted results to openLogWorkout
  const endWorkoutSession = () => {
    let formattedExercises: LogExerciseData[] = [];
    
    if (activeWorkout) {
      // Format the collected results into the structure needed for the API
      formattedExercises = activeWorkout.day.exercises.map((exercise: any) => {
        const exerciseId = exercise.id || exercise._id;
        const result = exerciseResults[exerciseId] || {};
        const completed = !!completedExercises[exerciseId];
        
        return {
            exerciseId: exerciseId,
            name: exercise.name,
            sets: exercise.sets || 0,
            reps: exercise.reps || 0,
            weight: result.weight || '', // Use saved result or default empty string
            duration: 0, // Placeholder for duration tracking
            completed: completed,
            notes: result.notes || ''
        };
      });
      
       // Prompt to log workout if any exercises were completed or attempted
      if (formattedExercises.length > 0) {
        openLogWorkout(activeWorkout, formattedExercises);
      }
    } else {
         toast({ title: "No active workout", description: "Cannot end a session that wasn't started.", variant: "destructive" });
    }
    
    // Clean up timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset workout session state
    setWorkoutSessionActive(false);
    setActiveWorkout(null);
    setCurrentExerciseIndex(0);
    setRestTimerActive(false);
    // Keep exerciseResults/completedExercises if needed for viewing history,
    // otherwise reset them here: setExerciseResults({}); setCompletedExercises({});
  };

  // Calculate workout completion percentage
  const getWorkoutCompletionPercentage = (): number => {
    if (!activeWorkout) return 0;
    
    const totalExercises = activeWorkout.day.exercises.length;
    const completedCount = Object.keys(completedExercises).length;
    
    return Math.round((completedCount / totalExercises) * 100);
  };

  // Navigate to next/previous exercise
  const navigateExercise = (direction: 'prev' | 'next') => {
    if (!activeWorkout) return;
    
    const totalExercises = activeWorkout.day.exercises.length;
    
    if (direction === 'prev' && currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    } else if (direction === 'next' && currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Function to handle toggling a coach selection
  const handleCoachSelectionToggle = (coachId: string) => {
    setCoachesToShareWith(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  // Helper function to update temporary results
  const updateTemporaryExerciseResult = (field: 'weight' | 'actualReps' | 'notes', value: string) => {
    if (!activeWorkout) return;
    const currentExercise = activeWorkout.day.exercises[currentExerciseIndex];
    const exerciseId = currentExercise.id || currentExercise._id;
    
    setExerciseResults(prev => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || {}),
        [field]: value,
      }
    }));
  };

  // Function to specifically handle un-completing an exercise
  const uncompleteExercise = (exerciseId: string) => {
    // Remove from completed list
    setCompletedExercises(prev => {
      const updated = {...prev};
      delete updated[exerciseId];
      return updated;
    });
    console.log(`Exercise ${exerciseId} marked as not complete.`);
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full max-w-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Training Programs</h1>
          <p className="text-gray-500 mt-1">View and track your assigned training regimens</p>
        </div>
      </div>

      <Tabs defaultValue="today" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="today" className="relative">
            Today
            {todaysWorkouts.length > 0 && (
              <Badge className="ml-2 bg-coach-primary">{todaysWorkouts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="programs">All Programs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4" key="today-tab">
          {todaysWorkouts.length === 0 ? (
            <Card key="no-workouts-today" className="overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No workouts scheduled for today</h3>
                <p className="text-gray-500 mt-1">Check your upcoming tab to see what's next</p>
              </CardContent>
            </Card>
          ) : (
            todaysWorkouts.map(({ day, regimen }, index) => (
              <Card key={`today-${day.id || day._id || index}`} className="overflow-hidden">
                <CardHeader className="bg-gray-50 py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">{day.name}</CardTitle>
                    <div className="flex gap-2 items-center">
                      <IntensityIndicator intensity={day.intensity} />
                    <Badge variant="outline">{regimen.name}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4">
                    <ul className="divide-y divide-gray-100">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <li key={exercise.id || exercise._id || `exercise-${exerciseIndex}`} className="py-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-base">{exercise.name}</h3>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700 mb-2">
                            <span className="mr-6">{exercise.sets} sets</span>
                            <span>
                              {exercise.isReps 
                                ? `${exercise.reps} reps` 
                                : `Duration: ${exercise.duration}`}
                            </span>
                            {exercise.restInterval && (
                              <span className="ml-6">Rest: {exercise.restInterval}</span>
                            )}
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Notes:</span> {exercise.notes}
                            </p>
                          )}
                          
                          {exercise.mediaLinks.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Media:</p>
                              <div className="flex flex-wrap gap-2">
                                {exercise.mediaLinks.map((link, i) => (
                                  <a 
                                    key={`today-media-${exercise.id || exercise._id || exerciseIndex}-${i}`} 
                                    href={typeof link === 'string' ? link : link.url || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Media {i+1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => openLogWorkout({ day, regimen }, day.exercises.map((ex: any) => ({ 
                          exerciseId: ex.id || ex._id, 
                          name: ex.name, 
                          sets: ex.sets || 0, 
                          reps: ex.reps || 0, 
                          weight: 0, // Default weight if not tracked 
                          duration: 0, // Default duration
                          completed: false, // Assume not completed if logging directly
                      }))) } 
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Log Workout
                    </Button>
                    <Button 
                      className="bg-coach-primary hover:bg-coach-primary/90"
                      onClick={() => startWorkout({ day, regimen })}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4" key="upcoming-tab">
          {upcomingWorkouts.length === 0 ? (
            <Card key="no-upcoming-workouts" className="overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No upcoming workouts</h3>
                <p className="text-gray-500 mt-1">Your schedule is clear for the next week</p>
              </CardContent>
            </Card>
          ) : (
            upcomingWorkouts.map(({ day, regimen, date }, index) => (
              <Card key={`upcoming-${day.id || day._id || index}`} className="overflow-hidden">
                <CardHeader className="bg-gray-50 py-3 cursor-pointer" onClick={() => toggleExerciseExpand(day.id)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium">{day.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {format(date, 'EEEE, MMMM d')} • {regimen.name}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <IntensityIndicator intensity={day.intensity} />
                    <Badge variant="outline" className="whitespace-nowrap">
                      In {Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {expandedExercises[day.id] ? (
                    <ul className="divide-y divide-gray-100">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <li key={exercise.id || exercise._id || `exercise-${exerciseIndex}`} className="py-3">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-base">{exercise.name}</h3>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700 mb-2">
                            <span className="mr-6">{exercise.sets} sets</span>
                            <span>
                              {exercise.isReps 
                                ? `${exercise.reps} reps` 
                                : `Duration: ${exercise.duration}`}
                            </span>
                            {exercise.restInterval && (
                              <span className="ml-6">Rest: {exercise.restInterval}</span>
                            )}
                          </div>
                          
                          {exercise.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Notes:</span> {exercise.notes}
                            </p>
                          )}
                          
                          {exercise.mediaLinks.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Media:</p>
                              <div className="flex flex-wrap gap-2">
                                {exercise.mediaLinks.map((link, i) => (
                                  <a 
                                    key={`upcoming-media-${exercise.id || exercise._id || exerciseIndex}-${i}`} 
                                    href={typeof link === 'string' ? link : link.url || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Media {i+1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        {day.exercises.length} exercises • Approximately 45-60 minutes
                      </p>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleExerciseExpand(day.id)}
                        >
                          View Exercises
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="programs" className="space-y-6" key="programs-tab">
          <Card key="programs-filter" className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search programs..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex gap-2">
                  <Filter size={18} />
                  <span className="hidden md:inline">Filters</span>
                </Button>
              </div>
            </div>
          </Card>
          
          {filteredRegimens.length === 0 ? (
            <div key="no-programs-found" className="text-center py-12">
              <Dumbbell className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No programs found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" key="programs-grid">
              {selectedView === 'calendar' ? (
                <>
                  <Card key="programs-list">
                    <CardHeader>
                      <CardTitle className="text-lg">Programs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {filteredRegimens.map((regimen, index) => (
                          <div 
                            key={regimen.id || regimen._id || `regimen-${index}`}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedRegimenId === regimen.id ? 'bg-gray-50' : ''
                            }`}
                            onClick={() => setSelectedRegimenId(regimen.id || regimen._id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium">{regimen.name}</h3>
                              {progress.find(p => p.regimenId === regimen.id)?.streak > 0 && (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                  <Star className="h-3 w-3 mr-1 fill-amber-500 stroke-amber-500" /> 
                                  {progress.find(p => p.regimenId === regimen.id)?.streak} day streak
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{regimen.description}</p>
                            <div className="flex items-center">
                              <Progress value={getCompletion(regimen.id || regimen._id)} className="h-2 flex-1" />
                              <span className="text-xs text-gray-500 ml-2">{getCompletion(regimen.id || regimen._id)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="md:col-span-2">
                    {selectedRegimenId ? (
                      <Card key={`regimen-detail-${selectedRegimenId}`}>
                        <CardHeader>
                          <CardTitle>
                            {selectedRegimen?.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <p className="text-gray-600">{selectedRegimen?.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline">{selectedRegimen?.category || 'General'}</Badge>
                              <Badge variant="outline">{selectedRegimen?.level || 'Beginner'}</Badge>
                            </div>
                          </div>
                          <div className="mb-4">
                            <h3 className="text-md font-medium mb-2">Workout Days</h3>
                            <div className="space-y-2">
                              {selectedRegimen?.days.map((day, dayIndex) => (
                                <div key={day.id || day._id || `selected-day-${dayIndex}`} className="flex justify-between items-center p-2 border rounded-md">
                                  <span>{day.name}</span>
                                  <IntensityIndicator intensity={day.intensity} />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-md font-medium mb-2">Program Information</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span>Total Workout Days</span>
                                <span>{selectedRegimen?.days.length || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Start Date</span>
                                <span>{selectedRegimen?.startDate ? format(new Date(selectedRegimen.startDate), 'MMM d, yyyy') : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>End Date</span>
                                <span>{selectedRegimen?.endDate ? format(new Date(selectedRegimen.endDate), 'MMM d, yyyy') : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card key="select-program-prompt">
                        <CardContent className="flex flex-col items-center justify-center py-20">
                          <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium">Select a program</h3>
                          <p className="text-gray-500 mt-1">Choose a program to view its details</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              ) : selectedView === 'list' ? (
                <div className="col-span-full" key="list-view-container">
                  {selectedRegimen && <RegimenListView key={`list-view-${selectedRegimen.id}`} days={selectedRegimen.days} />}
                </div>
              ) : (
                <div className="col-span-full" key="table-view-container">
                  {selectedRegimen && <RegimenTableView key={`table-view-${selectedRegimen.id}`} days={selectedRegimen.days} />}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workout Log Dialog */}
      <Dialog open={logWorkoutOpen} onOpenChange={setLogWorkoutOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Log Workout: {currentWorkout?.day?.name}</DialogTitle>
            <DialogDescription>
              Rate your workout and add any notes from {format(new Date(), 'MMMM d, yyyy')}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Rating Slider */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Rating
              </Label>
              <Slider
                id="rating"
                min={1}
                max={10}
                step={1}
                value={[workoutRating]}
                onValueChange={(value) => setWorkoutRating(value[0])}
                className="col-span-2"
              />
              <span className="font-medium text-center">{workoutRating}/10</span>
            </div>
            {/* Notes Textarea */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How did the workout feel? Any PRs?"
                className="col-span-3"
              />
            </div>
            
            {/* Coach Sharing Selector */}
            {(loadingCoaches || availableCoaches.length > 0) && (
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                        Share With
                    </Label>
                    {loadingCoaches ? (
                        <div className="col-span-3 h-10 flex items-center text-muted-foreground">Loading coaches...</div>
                    ) : availableCoaches.length === 0 ? (
                         <div className="col-span-3 h-10 flex items-center text-muted-foreground">No coaches assigned.</div>
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="col-span-3 justify-between">
                                  {/* Display selection summary */}
                                  {coachesToShareWith.length === 0
                                   ? "Select coaches..."
                                   : coachesToShareWith.length === 1
                                   ? availableCoaches.find(c => c.id === coachesToShareWith[0])?.name ?? '1 selected'
                                   : `${coachesToShareWith.length} coaches selected`}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <ScrollArea className="h-[200px]">
                                  {availableCoaches.map((coach) => (
                                    <div key={coach.id} 
                                          className="flex items-center space-x-2 p-2 hover:bg-accent cursor-pointer"
                                          onClick={() => handleCoachSelectionToggle(coach.id)} 
                                          >
                                      <Checkbox
                                          id={`coach-${coach.id}`}
                                          checked={coachesToShareWith.includes(coach.id)}
                                          onCheckedChange={(checked) => handleCoachSelectionToggle(coach.id)}
                                          onClick={(e) => e.stopPropagation()} 
                                      />
                                      <Label htmlFor={`coach-${coach.id}`} className="font-normal cursor-pointer">
                                        {coach.name}
                                      </Label>
                                    </div>
                                  ))}
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                  </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogWorkoutOpen(false)}>Cancel</Button>
            <Button onClick={submitWorkoutLog} disabled={loggingWorkout}>
              {loggingWorkout ? 'Logging...' : 'Log Workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Workout Session Dialog */}
      <Dialog 
        open={workoutSessionActive} 
        onOpenChange={(open) => {
          if (!open) endWorkoutSession();
          setWorkoutSessionActive(open);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Workout</DialogTitle>
            {activeWorkout && (
              <DialogDescription>
                {activeWorkout.day.name} • {activeWorkout.regimen.name}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {activeWorkout && (
            <div className="space-y-6 py-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {Object.keys(completedExercises).length} of {activeWorkout.day.exercises.length} exercises
                  </span>
                </div>
                <Progress value={getWorkoutCompletionPercentage()} className="h-2" />
              </div>
              
              {/* Rest timer (if active) */}
              {restTimerActive && (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="pt-6 flex flex-col items-center justify-center">
                    <Timer className="h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="text-xl font-semibold mb-1">Rest Time</h3>
                    <p className="text-3xl font-mono mb-4">{formatTime(restTimeRemaining)}</p>
                    <Button variant="outline" onClick={skipRestTimer}>
                      Skip Rest
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Current exercise */}
              {!restTimerActive && activeWorkout.day.exercises.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateExercise('prev')}
                      disabled={currentExerciseIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentExerciseIndex + 1} of {activeWorkout.day.exercises.length}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigateExercise('next')}
                      disabled={currentExerciseIndex === activeWorkout.day.exercises.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Card className={`${completedExercises[activeWorkout.day.exercises[currentExerciseIndex].id] ? 'border-green-200 bg-green-50' : ''}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{activeWorkout.day.exercises[currentExerciseIndex].name}</CardTitle>
                      <CardDescription>
                        {activeWorkout.day.exercises[currentExerciseIndex].sets} sets • 
                        {activeWorkout.day.exercises[currentExerciseIndex].isReps 
                          ? ` ${activeWorkout.day.exercises[currentExerciseIndex].reps} reps` 
                          : ` ${activeWorkout.day.exercises[currentExerciseIndex].duration}`
                        }
                        {activeWorkout.day.exercises[currentExerciseIndex].restInterval && 
                          ` • Rest: ${activeWorkout.day.exercises[currentExerciseIndex].restInterval}`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!completedExercises[activeWorkout.day.exercises[currentExerciseIndex].id] ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Weight (optional)</label>
                              <Input
                                value={exerciseWeight}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setExerciseWeight(newValue);
                                  updateTemporaryExerciseResult('weight', newValue);
                                }}
                                placeholder="e.g., 150 lbs"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Actual Reps</label>
                              <Input
                                value={exerciseActualReps}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setExerciseActualReps(newValue);
                                  updateTemporaryExerciseResult('actualReps', newValue);
                                }}
                                placeholder={`Target: ${activeWorkout.day.exercises[currentExerciseIndex].reps}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Notes (optional)</label>
                            <Input
                              value={exerciseNotes}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setExerciseNotes(newValue);
                                updateTemporaryExerciseResult('notes', newValue);
                              }}
                              placeholder="How did this exercise feel?"
                            />
                          </div>
                          <Button 
                            className="w-full bg-coach-primary hover:bg-coach-primary/90"
                            onClick={() => completeExercise(activeWorkout.day.exercises[currentExerciseIndex].id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Exercise
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                          <p className="font-medium text-green-700">Exercise Completed!</p>
                          <p className="text-sm text-gray-500 mt-1">Details saved</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Exercise list */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Workout Plan</h3>
                <div className="border rounded-md divide-y">
                  {activeWorkout.day.exercises.map((exercise, index) => {
                    const exerciseId = exercise.id || exercise._id;
                    const isCompleted = !!completedExercises[exerciseId];
                    return (
                      <div 
                        key={exerciseId}
                        className={`p-3 flex items-center justify-between ${index === currentExerciseIndex ? 'bg-gray-50' : ''}`}
                        onClick={() => setCurrentExerciseIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <Checkbox 
                              id={`list-check-${exerciseId}`}
                              checked={isCompleted} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  if (!isCompleted) {
                                    setCurrentExerciseIndex(index);
                                    completeExercise(exerciseId);
                                  }
                                } else {
                                  uncompleteExercise(exerciseId);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <p className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                              {exercise.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {exercise.sets} sets • 
                              {exercise.isReps 
                                ? ` ${exercise.reps} reps` 
                                : ` ${exercise.duration}`
                              }
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentExerciseIndex(index);
                          }}
                        >
                          {index === currentExerciseIndex ? 'Current' : 'View'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={endWorkoutSession}
                >
                  End Workout
                </Button>
                <Button 
                  className="bg-coach-primary hover:bg-coach-primary/90"
                  onClick={endWorkoutSession}
                  disabled={Object.keys(completedExercises).length === 0}
                >
                  Complete & Log Workout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AthleteRegimens;

// Adding RegimenDetail component for route handling
export const RegimenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // This is a placeholder - in a real implementation, you'd fetch the specific regimen data
  useEffect(() => {
    console.warn("RegimenDetail component/route might need review or removal.");
    // Potentially fetch specific regimen details based on id
    // Or redirect if this component is not meant to be used directly
    // navigate(`/app/athlete/regimens`); // Example redirect
  }, [id, navigate]);

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/app/athlete/regimens')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Regimens
      </Button>
      
      <Card className="mb-6" key="regimen-detail-card">
        <CardHeader>
          <CardTitle>Regimen Details</CardTitle>
          <CardDescription>
            Viewing details for regimen ID: {id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The detailed view for this regimen is under development.</p>
          <p>Please check back soon for a complete view of this training regimen.</p>
        </CardContent>
      </Card>
    </div>
  );
};
