import React, { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExerciseType, RegimenDayType, IntensityLevel } from '@/types/regimen';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ChevronRight, Copy, Image, Video, Link, Upload, X, Play, ExternalLink, HelpCircle, Loader2, Check, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DayEditorProps {
  isOpen: boolean;
  onClose: () => void;
  day: RegimenDayType | null;
  onSave: (day: RegimenDayType) => void;
  defaultIntensity?: IntensityLevel;
  customIntensities?: string[];
}

type ExerciseCountType = 'reps' | 'distance';
type MediaType = 'image' | 'video' | 'link';

const DayEditor: React.FC<DayEditorProps> = ({
  isOpen,
  onClose,
  day,
  onSave,
  defaultIntensity = 'default',
  customIntensities = []
}) => {
  // Default empty day
  const emptyDay: RegimenDayType = {
    id: '',
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    intensity: defaultIntensity,
    exercises: []
  };

  // Form state
  const [editingDay, setEditingDay] = useState<RegimenDayType>(day || emptyDay);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    day ? new Date(day.date) : new Date()
  );

  // Track collapsed state for each exercise
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  // Track copied exercises for pasting
  const [copiedExercises, setCopiedExercises] = useState<ExerciseType[]>([]);
  
  // Media state
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('link');

  // Add these state variables within the component
  const [selectedExerciseForTips, setSelectedExerciseForTips] = useState<string | null>(null);
  const [exerciseTips, setExerciseTips] = useState('');
  const [loadingTips, setLoadingTips] = useState(false);
  // Add a state to track active dragging
  const [isDragging, setIsDragging] = useState(false);

  // Add these state variables after the other state variables
  const [bulkExercisesText, setBulkExercisesText] = useState<string>('');
  const [showBulkInput, setShowBulkInput] = useState<boolean>(false);
  const [bulkInputError, setBulkInputError] = useState<string | null>(null);

  // Initialize editing day when component mounts or day prop changes
  useEffect(() => {
    if (day) {
      setEditingDay(day);
    } else {
      setEditingDay({
        id: uuidv4(),
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        intensity: defaultIntensity || 'default',
        exercises: []
      });
    }
  }, [day, defaultIntensity]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setEditingDay(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  // Toggle collapse state for an exercise
  const toggleExerciseCollapse = (exerciseId: string) => {
    setCollapsedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  // Add a new exercise at a specific position
  const addExerciseAt = (position?: number) => {
    const newExercise: ExerciseType = {
      id: uuidv4(),
      name: '',
      sets: 0,
      isReps: true,
      reps: 0,
      duration: '',
      distance: '',
      restInterval: '01:00',
      notes: '',
      mediaLinks: [],
      perSide: false
    };

    setEditingDay(prev => {
      const newExercises = [...prev.exercises];
      
      if (position !== undefined) {
        // Insert at specified position
        newExercises.splice(position + 1, 0, newExercise);
      } else {
        // Add to beginning of the list
        newExercises.unshift(newExercise);
      }
      
      return {
        ...prev,
        exercises: newExercises
      };
    });

    // Set new exercise to expanded state
    setCollapsedExercises(prev => ({
      ...prev,
      [newExercise.id]: false
    }));
  };

  // Keep addExercise for compatibility
  const addExercise = () => addExerciseAt();

  // Update an exercise
  const updateExercise = (exerciseId: string, field: keyof ExerciseType, value: any) => {
    setEditingDay(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  // Update exercise count type (reps, time, or distance)
  const updateExerciseCountType = (exerciseId: string, countType: ExerciseCountType) => {
    console.log('Changing exercise count type:', exerciseId, countType);
    
    setEditingDay(prev => {
      // Find the exercise to update
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          console.log('Found exercise to update:', ex.id);
          console.log('Current exercise state:', JSON.stringify(ex));
          
          // Create updated exercise based on the count type
          const updated = {
            ...ex,
            isReps: countType === 'reps'
          };
          
          // Ensure appropriate values are set based on the new count type
          if (countType === 'reps') {
            // Don't override existing reps value
            updated.reps = updated.reps ?? 0;
          } else if (countType === 'distance') {
            // If switching to distance, ensure distance has a value
            updated.distance = updated.distance || '30m';
          }
          
          console.log('Updated exercise:', JSON.stringify(updated));
          return updated;
        }
        return ex;
      });
      
      console.log('Updated exercises:', JSON.stringify(updatedExercises));
      return {
        ...prev,
        exercises: updatedExercises
      };
    });
  };

  // Remove an exercise
  const removeExercise = (exerciseId: string) => {
    setEditingDay(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  };

  // Copy an exercise
  const copyExercise = (exerciseId: string) => {
    const exerciseToCopy = editingDay.exercises.find(ex => ex.id === exerciseId);
    
    if (exerciseToCopy) {
      // Create a copy with a new ID
      const exerciseCopy: ExerciseType = {
        ...exerciseToCopy,
        id: uuidv4(),
        name: `${exerciseToCopy.name} (Copy)`
      };
      
      // Find the index of the original exercise
      const index = editingDay.exercises.findIndex(ex => ex.id === exerciseId);
      
      // Insert the copy after the original
      setEditingDay(prev => {
        const newExercises = [...prev.exercises];
        newExercises.splice(index + 1, 0, exerciseCopy);
        
        return {
          ...prev,
          exercises: newExercises
        };
      });
      
      // Set the copied exercise to expanded state
      setCollapsedExercises(prev => ({
        ...prev,
        [exerciseCopy.id]: false
      }));
    }
  };

  // Copy multiple exercises for pasting later
  const copyMultipleExercises = () => {
    // Copy all exercises
    const exercisesToCopy = [...editingDay.exercises];
    setCopiedExercises(exercisesToCopy.map(ex => ({...ex, id: uuidv4()})));
    
    toast({
      title: "Exercises Copied",
      description: `Copied ${exercisesToCopy.length} exercises to clipboard`,
      variant: "default",
    });
  };

  // Paste copied exercises
  const pasteExercises = () => {
    if (copiedExercises.length === 0) return;
    
    // Generate new IDs for the pasted exercises
    const pastableExercises = copiedExercises.map(ex => ({
      ...ex,
      id: uuidv4() // Ensure each pasted exercise has a new unique ID
    }));
    
    // Add the exercises to the current day
    setEditingDay(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...pastableExercises]
    }));
    
    // Don't clear the copiedExercises to allow multiple pastes
    
    toast({
      title: "Exercises Pasted",
      description: `Added ${pastableExercises.length} exercises to the day`,
      variant: "default"
    });
  };

  // Add a media link to an exercise
  const addMediaLink = (exerciseId: string, mediaUrl: string, mediaType: MediaType = 'link') => {
    // Basic validation
    if (!mediaUrl.trim()) return;
    
    // Add proper prefix for type identification if it's not already a URL
    if (!mediaUrl.startsWith('http')) {
      if (mediaType === 'image') {
        mediaUrl = `image:${mediaUrl}`;
      } else if (mediaType === 'video') {
        mediaUrl = `video:${mediaUrl}`;
      } else {
        mediaUrl = `link:${mediaUrl}`;
      }
    }
    
    updateExercise(exerciseId, 'mediaLinks', [...(editingDay.exercises.find(ex => ex.id === exerciseId)?.mediaLinks || []), mediaUrl]);
  };

  // Remove a media link from an exercise
  const removeMediaLink = (exerciseId: string, mediaIndex: number) => {
    const exercise = editingDay.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      const newLinks = [...exercise.mediaLinks];
      newLinks.splice(mediaIndex, 1);
      updateExercise(exerciseId, 'mediaLinks', newLinks);
    }
  };

  // Determine the media type based on the URL
  const getMediaType = (url: string): MediaType => {
    const lowerUrl = url.toLowerCase();
    if (url.startsWith('image:') || lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return 'image';
    } else if (url.startsWith('video:') || lowerUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/) || 
              lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ||
              lowerUrl.includes('vimeo.com')) {
      return 'video';
    }
    return 'link';
  };

  // Handle file upload
  const handleFileUpload = async (exerciseId: string, file: File) => {
    // In a real app, you would upload to a server and get back a URL
    // For demo purposes, we'll create a local object URL
    try {
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      const url = URL.createObjectURL(file);
      
      // Add to media links
      addMediaLink(exerciseId, url, mediaType);
      
      toast({
        title: "File added",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} has been added to the exercise.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle save
  const handleSave = () => {
    // Validate exercises
    const validatedExercises = editingDay.exercises.map(exercise => {
      const countType = getExerciseCountType(exercise);
      
      // Keep all fields but ensure proper values based on type
      return {
        ...exercise,
        sets: exercise.sets >= 0 ? exercise.sets : 0,
        reps: countType === 'reps' ? (exercise.reps >= 0 ? exercise.reps : 0) : 0,
        duration: '', // No longer used
        distance: countType === 'distance' ? (exercise.distance || '30m') : '',
        // Always require a valid rest interval
        restInterval: exercise.restInterval || '01:00'
      };
    });
    
    onSave({
      ...editingDay,
      exercises: validatedExercises
    });
    onClose();
  };

  // All available intensity options
  const intensityOptions: IntensityLevel[] = [
    'Easy', 
    'Medium', 
    'Hard', 
    'Rest', 
    ...customIntensities
  ];

  // Determine exercise count type
  const getExerciseCountType = (exercise: ExerciseType): ExerciseCountType => {
    if (exercise.isReps) {
      return 'reps';
    } else {
      return 'distance';
    }
  };

  // Add drag start handler
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    // Reset dragging state
    setIsDragging(false);
    
    const { destination, source } = result;

    // If we don't have a destination or dropped outside the list
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Reorder the exercise list
    const exercises = Array.from(editingDay.exercises);
    const [removed] = exercises.splice(source.index, 1);
    exercises.splice(destination.index, 0, removed);

    // Update state with new order
    setEditingDay(prev => ({
      ...prev,
      exercises: exercises
    }));
  };

  // Add this function to get exercise tips
  const getExerciseTips = async (exerciseId: string) => {
    try {
      const exercise = editingDay.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return;
      
      setLoadingTips(true);
      setSelectedExerciseForTips(exerciseId);
      
      // In a real implementation, this would call the backend
      // For now, generate some generic tips based on the exercise name
      setTimeout(() => {
        const exerciseName = exercise.name.toLowerCase();
        let tips = "";
        
        if (exerciseName.includes("löpning") || exerciseName.includes("running")) {
          tips = "• Maintain proper posture with shoulders relaxed\n• Land midfoot rather than heel first\n• Keep a cadence of 170-180 steps per minute\n• Look ahead, not down at your feet\n• Breathe rhythmically, matching your steps";
        } else if (exerciseName.includes("squat") || exerciseName.includes("knäböj")) {
          tips = "• Keep weight in heels and midfoot\n• Track knees in line with toes\n• Maintain neutral spine throughout\n• Descend until thighs are parallel to ground\n• Drive through heels to stand up\n• Keep chest up throughout movement";
        } else if (exerciseName.includes("press") || exerciseName.includes("bench") || exerciseName.includes("bänk")) {
          tips = "• Maintain five points of contact with bench\n• Keep wrists stacked over elbows\n• Tuck elbows at 45° angle to torso\n• Control the descent, don't bounce\n• Drive the bar in a slight arc pattern\n• Maintain proper scapular retraction";
        } else {
          tips = `Form tips for ${exercise.name}:\n• Maintain proper alignment throughout the movement\n• Control the movement through the full range of motion\n• Focus on quality over quantity\n• Breathe properly - exhale during exertion\n• Start with lighter weights to master form`;
        }
        
        setExerciseTips(tips);
        setLoadingTips(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        title: "Error",
        description: "Could not load exercise tips. Please try again.",
        variant: "destructive"
      });
      setLoadingTips(false);
    }
  };

  // Update the handleBulkExerciseCreation function with a more comprehensive regex pattern
  const handleBulkExerciseCreation = () => {
    if (!bulkExercisesText.trim()) {
      setBulkInputError('Please enter at least one exercise name');
      return;
    }
    
    // Split the input by new lines and/or commas
    const exerciseEntries = bulkExercisesText
      .split(/[\n,]+/)
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0);
    
    if (exerciseEntries.length === 0) {
      setBulkInputError('Please enter at least one exercise name');
      return;
    }
    
    // Parse each exercise entry
    const parsedExercises = exerciseEntries.map(entry => {
      // Default values
      let name = entry;
      let sets = 3;
      let isReps = true;
      let reps = 10;
      let distance = '';
      
      // Check for triple format: "Exercise 2x3x200m" (2 sets, 3 reps, 200m)
      const tripleFormatMatch = entry.match(/^(.*?)\s+(\d+)[xz](\d+)[xz](\d+)([a-zA-Z]*)$/);
      
      if (tripleFormatMatch) {
        name = tripleFormatMatch[1].trim();
        sets = parseInt(tripleFormatMatch[2], 10);
        reps = parseInt(tripleFormatMatch[3], 10);
        
        // Check if there's a distance unit
        if (tripleFormatMatch[5]) {
          isReps = false; // This is a distance-based exercise with reps
          distance = tripleFormatMatch[4] + tripleFormatMatch[5]; // e.g., "200m"
        } else {
          // If no unit, treat the last number as additional reps info
          // Keep isReps as true
        }
      } else {
        // Check for the previous format: "Exercise 3x10" or "Exercise 3x100m"
        const formatMatch = entry.match(/^(.*?)\s+(\d+)([xz])(\d+)([a-zA-Z]*)$/);
        
        if (formatMatch) {
          name = formatMatch[1].trim();
          sets = parseInt(formatMatch[2], 10);
          
          // Check if there's a distance unit (m, km, etc.)
          if (formatMatch[5]) {
            isReps = false;
            distance = formatMatch[4] + formatMatch[5]; // e.g., "100m"
            reps = 0; // Reset reps when distance is used
          } else {
            reps = parseInt(formatMatch[4], 10);
          }
        }
      }
      
      return {
        id: uuidv4(),
        name,
        sets,
        isReps,
        reps,
        duration: '',
        distance,
        restInterval: '01:00',
        notes: '',
        mediaLinks: [],
        perSide: false
      };
    });
    
    // Check for duplicate names
    const nameSet = new Set(parsedExercises.map(ex => ex.name));
    if (nameSet.size !== parsedExercises.length) {
      setBulkInputError('Duplicate exercise names detected');
      return;
    }
    
    // Add the exercises to the current list
    setEditingDay(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...parsedExercises]
    }));
    
    // Clear input and error
    setBulkExercisesText('');
    setBulkInputError(null);
    setShowBulkInput(false);
    
    toast({
      title: "Exercises Added",
      description: `Added ${parsedExercises.length} exercises`,
      variant: "default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-slate-50 border-slate-200 shadow-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {day ? 'Edit Training Day' : 'Add New Training Day'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Customize your workout with exercises, sets, reps, and rest intervals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Top section with key info */}
          <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Day Name</Label>
              <Input
                id="name"
                placeholder="Monday Strength"
                value={editingDay.name}
                onChange={(e) => 
                  setEditingDay(prev => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            <div className="w-[200px]">
              <Label htmlFor="intensity" className="text-sm font-medium text-slate-700">Intensity</Label>
              <Select 
                value={editingDay.intensity} 
                onValueChange={(value) => 
                  setEditingDay(prev => ({ ...prev, intensity: value }))
                }
              >
                <SelectTrigger id="intensity" className="mt-1 border-slate-200 bg-white">
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="text-gray-500">
                    Default
                  </SelectItem>
                  {intensityOptions.map((intensity) => (
                    <SelectItem key={intensity} value={intensity} className={
                      intensity === 'Easy' ? 'text-green-600' :
                      intensity === 'Medium' ? 'text-blue-600' :
                      intensity === 'Hard' ? 'text-red-600' :
                      intensity === 'Rest' ? 'text-slate-500' : ''
                    }>
                      {intensity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Picker */}
            <div className="w-[200px]">
              <Label htmlFor="date" className="text-sm font-medium text-slate-700">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    id="date"
                    variant="outline" 
                    className="w-full mt-1 justify-start text-left font-normal border-slate-200 hover:bg-slate-50"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Exercise Management */}
          <div className="flex justify-between items-center px-1">
            <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span>Exercises</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium py-0.5 px-2 rounded-full">
                {editingDay.exercises.length}
              </span>
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Bulk Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyMultipleExercises}
                disabled={editingDay.exercises.length === 0}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pasteExercises}
                disabled={copiedExercises.length === 0}
                className={copiedExercises.length > 0 ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "border-slate-200"}
              >
                <Plus className="h-4 w-4 mr-1" />
                Paste ({copiedExercises.length})
              </Button>
              <Button 
                onClick={addExercise} 
                variant="default" 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </Button>
            </div>
          </div>

          {/* Bulk Exercise Creation */}
          {showBulkInput && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <div className="flex justify-between items-start mb-2">
                <Label htmlFor="bulk-exercises" className="text-sm font-medium text-slate-700 block">
                  Enter multiple exercises (one per line or separated by commas)
                </Label>
                <div className="text-xs text-slate-500 max-w-xs">
                  <p>Format examples:</p>
                  <p className="mt-1"><span className="font-medium">Push-ups</span> - Uses defaults (3×10, 60s rest)</p>
                  <p><span className="font-medium">Squats 4x12</span> - 4 sets, 12 reps</p>
                  <p><span className="font-medium">Run 3x400m</span> - 3 sets, 400 meters</p>
                  <p><span className="font-medium">Sprint 3z200m</span> - 3 sets, 200 meters (z also works)</p>
                  <p><span className="font-medium">Sprint 2x3x200m</span> - 2 sets, 3 reps of 200m</p>
                </div>
              </div>
              <Textarea
                id="bulk-exercises"
                placeholder="Push-ups&#10;Squats 4x12&#10;Run 3x400m&#10;Bench Press 5x5"
                value={bulkExercisesText}
                onChange={(e) => {
                  setBulkExercisesText(e.target.value);
                  if (bulkInputError) setBulkInputError(null);
                }}
                className="min-h-[120px] border-slate-200 focus:border-blue-300 focus:ring-blue-200 mb-2"
              />
              
              {bulkInputError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{bulkInputError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBulkInput(false);
                    setBulkExercisesText('');
                    setBulkInputError(null);
                  }}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkExerciseCreation}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Exercises
                </Button>
              </div>
            </div>
          )}

          {/* Exercise List */}
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="exercises">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 p-1 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2 transition-colors duration-200' : ''}`}
                  style={{
                    maxHeight: '60vh',
                    overflowY: 'auto'
                  }}
                >
                  {editingDay.exercises.map((exercise, index) => {
                    const exerciseCountType = getExerciseCountType(exercise);
                    const isCollapsed = collapsedExercises[exercise.id];

                    return (
                      <Draggable
                        key={exercise.id}
                        draggableId={exercise.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border ${isCollapsed ? 'border-slate-200' : 'border-slate-300'} 
                                      ${snapshot.isDragging ? 'opacity-80 shadow-md ring-2 ring-blue-200' : 'shadow-sm'} 
                                      ${!isCollapsed ? 'bg-gradient-to-r from-white to-slate-50' : 'bg-white'}
                                      transition-all duration-200`}
                          >
                            <CardHeader className={`p-3 flex flex-row items-center space-y-0 ${isCollapsed ? 'border-b-0' : 'border-b border-slate-100'}`}>
                              <div
                                {...provided.dragHandleProps}
                                className="mr-2 cursor-grab hover:bg-slate-100 p-1 rounded-md transition-colors"
                              >
                                <GripVertical className="text-slate-400 hover:text-slate-600" size={16} />
                              </div>
                              <div className="flex-1">
                                <Input
                                  placeholder="Exercise Name"
                                  value={exercise.name}
                                  onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                  className="border-slate-200 font-medium focus:border-blue-300 focus:ring-blue-200"
                                />
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <div className="flex items-center border rounded-md p-0.5 border-slate-200 bg-white">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                    className="w-14 text-center h-8 border-0 focus:ring-0"
                                    placeholder="Sets"
                                  />
                                  <span className="text-xs mr-1 text-slate-500">sets</span>
                                </div>
                                <div className="flex items-center space-x-0 bg-slate-50 rounded-md border border-slate-200">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-l-md hover:bg-slate-100 hover:text-blue-600"
                                    onClick={() => copyExercise(exercise.id)}
                                  >
                                    <Copy size={14} />
                                  </Button>
                                  <div className="w-[1px] h-5 bg-slate-200"></div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => removeExercise(exercise.id)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                  <div className="w-[1px] h-5 bg-slate-200"></div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-r-md hover:bg-slate-100"
                                    onClick={() => toggleExerciseCollapse(exercise.id)}
                                  >
                                    {isCollapsed ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronUp size={14} />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            {!isCollapsed && (
                              <CardContent className="px-3 pt-2 pb-3 bg-white bg-opacity-60">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex space-x-4 bg-slate-50 p-2 rounded-md">
                                    <div className="flex-1">
                                      <Label className="text-xs block mb-2 text-slate-600 font-medium">Count Type</Label>
                                      <RadioGroup 
                                        value={exerciseCountType}
                                        onValueChange={(value) => updateExerciseCountType(exercise.id, value as ExerciseCountType)}
                                        className="flex space-x-4"
                                      >
                                        <div className="flex items-center space-x-1">
                                          <RadioGroupItem value="reps" id={`${exercise.id}-count-reps`} className="text-blue-600" />
                                          <Label htmlFor={`${exercise.id}-count-reps`} className="cursor-pointer text-xs">Reps</Label>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <RadioGroupItem value="distance" id={`${exercise.id}-count-distance`} className="text-blue-600" />
                                          <Label htmlFor={`${exercise.id}-count-distance`} className="cursor-pointer text-xs">Distance</Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center h-full pt-5">
                                        <Checkbox 
                                          id={`${exercise.id}-per-side`} 
                                          checked={exercise.perSide}
                                          onCheckedChange={(checked) => 
                                            updateExercise(exercise.id, 'perSide', checked === true)
                                          }
                                          className="text-blue-600 border-slate-300"
                                        />
                                        <Label 
                                          htmlFor={`${exercise.id}-per-side`} 
                                          className="cursor-pointer text-xs ml-1 text-slate-600"
                                        >
                                          Per Side
                                        </Label>
                                      </div>
                                    </div>
                                  </div>

                                  {exerciseCountType === 'reps' && (
                                    <div>
                                      <Label htmlFor={`${exercise.id}-reps`} className="text-xs block mb-1 text-slate-600 font-medium">
                                        Reps {exercise.perSide && <span className="text-slate-400">(per side)</span>}
                                      </Label>
                                      <Input 
                                        id={`${exercise.id}-reps`}
                                        type="number"
                                        min="0"
                                        value={exercise.reps}
                                        onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) >= 0 ? parseInt(e.target.value) : 0)}
                                        className="h-9 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                      />
                                    </div>
                                  )}

                                  {exerciseCountType === 'distance' && (
                                    <div>
                                      <Label htmlFor={`${exercise.id}-distance`} className="text-xs block mb-1 text-slate-600 font-medium">
                                        Distance {exercise.perSide && <span className="text-slate-400">(per side)</span>}
                                      </Label>
                                      <Input 
                                        id={`${exercise.id}-distance`}
                                        placeholder="30m"
                                        value={exercise.distance || ''}
                                        onChange={(e) => updateExercise(exercise.id, 'distance', e.target.value)}
                                        className="h-9 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <Label htmlFor={`${exercise.id}-rest`} className="text-xs block mb-1 text-slate-600 font-medium">Rest Interval</Label>
                                    <Input 
                                      id={`${exercise.id}-rest`}
                                      placeholder="01:30"
                                      value={exercise.restInterval}
                                      onChange={(e) => updateExercise(exercise.id, 'restInterval', e.target.value)}
                                      className="h-9 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                    />
                                  </div>

                                  <div className="md:col-span-2 bg-slate-50 p-2 rounded-md mt-1">
                                    <div className="flex justify-between items-center">
                                      <Label htmlFor={`${exercise.id}-notes`} className="text-xs text-slate-600 font-medium">Notes & Form Tips</Label>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => getExerciseTips(exercise.id)}
                                        className="h-7 text-xs border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                                      >
                                        <HelpCircle className="h-3 w-3 mr-1" />
                                        Get Form Tips
                                      </Button>
                                    </div>
                                    <Textarea 
                                      id={`${exercise.id}-notes`}
                                      placeholder="Form tips, variations, weight recommendations, etc."
                                      value={exercise.notes}
                                      onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                                      className="h-16 mt-1 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addExerciseAt(index)}
                                    className="text-xs border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Exercise Below
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {editingDay.exercises.length === 0 && (
                    <div className="text-center py-8 border border-dashed rounded-lg border-slate-300 bg-slate-50">
                      <div className="text-slate-500 max-w-md mx-auto">
                        <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-3 shadow-sm flex items-center justify-center">
                          <Plus className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-slate-600 font-medium">No exercises added yet</p>
                        <p className="text-sm text-slate-500 mt-1 mb-3 max-w-xs mx-auto">
                          Add your first exercise to build your training day
                        </p>
                        <Button onClick={addExercise} variant="default" className="mt-2 bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Your First Exercise
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="mr-2 border-slate-200">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Training Day
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Exercise Tips Dialog */}
      <Dialog open={!!selectedExerciseForTips} onOpenChange={(open) => !open && setSelectedExerciseForTips(null)}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-blue-50 to-white border-blue-100">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <div className="bg-blue-100 p-1 rounded-full">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <span>
                {selectedExerciseForTips && 
                editingDay.exercises.find(ex => ex.id === selectedExerciseForTips)?.name}
              </span>
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Form tips and coaching advice
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingTips ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="whitespace-pre-line text-sm bg-white p-4 rounded-lg border border-blue-100">
                {exerciseTips}
              </div>
            )}
          </div>
          <DialogFooter>
            {selectedExerciseForTips && (
              <Button 
                onClick={() => {
                  const exercise = editingDay.exercises.find(ex => ex.id === selectedExerciseForTips);
                  if (!exercise) return;
                  
                  // Use the correct function to update exercise notes
                  const exerciseIndex = editingDay.exercises.findIndex(ex => ex.id === selectedExerciseForTips);
                  if (exerciseIndex !== -1) {
                    const updatedExercises = [...editingDay.exercises];
                    updatedExercises[exerciseIndex] = {
                      ...updatedExercises[exerciseIndex],
                      notes: exercise.notes ? `${exercise.notes}\n\n${exerciseTips}` : exerciseTips
                    };
                    
                    setEditingDay({
                      ...editingDay,
                      exercises: updatedExercises
                    });
                  }
                  
                  toast({
                    title: "Tips Added",
                    description: "Form tips added to exercise notes"
                  });
                  
                  setSelectedExerciseForTips(null);
                }}
                className="mr-auto bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Notes
              </Button>
            )}
            <Button onClick={() => setSelectedExerciseForTips(null)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default DayEditor; 