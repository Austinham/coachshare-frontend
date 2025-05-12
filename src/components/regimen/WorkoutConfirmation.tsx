import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2, ArrowLeft, Save, Plus, Languages } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RegimenDayType, ExerciseType, IntensityLevel } from '@/types/regimen';

interface WorkoutConfirmationProps {
  parsedDays: RegimenDayType[];
  onClose: () => void;
  onSave: (regimenData: any) => void;
  detectedLanguage?: string;
}

// Define a type for exercise field values
type ExerciseFieldValue = string | number | boolean;

const WorkoutConfirmation: React.FC<WorkoutConfirmationProps> = ({
  parsedDays,
  onClose,
  onSave,
  detectedLanguage = 'english',
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [days, setDays] = useState<RegimenDayType[]>(parsedDays);
  const [regimenName, setRegimenName] = useState('New OCR Regimen');
  const [regimenDescription, setRegimenDescription] = useState('Training regimen created from OCR scan');
  const [sportTag, setSportTag] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [intensityOptions, setIntensityOptions] = useState<IntensityLevel[]>(['Easy', 'Medium', 'Hard', 'Rest']);
  const [useEnglishIntensities, setUseEnglishIntensities] = useState(false);

  // Get localized intensity options based on detected language or user choice
  useEffect(() => {
    const getLocalizedIntensityOptions = () => {
      if (useEnglishIntensities) {
        return ['Easy', 'Medium', 'Hard', 'Rest'];
      }
      
      switch (detectedLanguage) {
        case 'spanish':
          return ['Fácil', 'Medio', 'Difícil', 'Descanso'];
        case 'french':
          return ['Facile', 'Moyen', 'Difficile', 'Repos'];
        case 'german':
          return ['Leicht', 'Mittel', 'Schwer', 'Ruhe'];
        case 'swedish':
          return ['Lätt', 'Medel', 'Svår', 'Vila'];
        case 'norwegian':
          return ['Lett', 'Middels', 'Hard', 'Hvile'];
        case 'danish':
          return ['Let', 'Mellem', 'Hård', 'Hvile'];
        case 'finnish':
          return ['Helppo', 'Keskitaso', 'Kova', 'Lepo'];
        case 'english':
        default:
          return ['Easy', 'Medium', 'Hard', 'Rest'];
      }
    };
    
    setIntensityOptions(getLocalizedIntensityOptions() as IntensityLevel[]);
  }, [detectedLanguage, useEnglishIntensities]);

  // Display formatted language name
  const getLanguageDisplay = (lang: string) => {
    const languages = {
      english: 'English',
      spanish: 'Spanish (Español)',
      french: 'French (Français)',
      german: 'German (Deutsch)',
      swedish: 'Swedish (Svenska)',
      norwegian: 'Norwegian (Norsk)',
      danish: 'Danish (Dansk)',
      finnish: 'Finnish (Suomi)'
    };
    return languages[lang as keyof typeof languages] || lang;
  };

  // Handle intensity change for a day
  const handleIntensityChange = (dayIndex: number, intensity: IntensityLevel) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].intensity = intensity;
    setDays(updatedDays);
  };

  // Handle exercise update
  const handleExerciseUpdate = (dayIndex: number, exerciseIndex: number, field: keyof ExerciseType, value: ExerciseFieldValue) => {
    const updatedDays = [...days];
    const exercise = {...updatedDays[dayIndex].exercises[exerciseIndex]};
    
    // Special handling for numeric fields
    if (field === 'sets' || field === 'reps') {
      exercise[field] = parseInt(value as string) || 0;
    } else {
      // Use type assertion to safely assign the value
      (exercise[field] as any) = value;
    }
    
    updatedDays[dayIndex].exercises[exerciseIndex] = exercise;
    setDays(updatedDays);
  };

  // Handle exercise deletion
  const handleDeleteExercise = (dayIndex: number, exerciseIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setDays(updatedDays);
  };

  // Handle adding a new exercise
  const handleAddExercise = (dayIndex: number) => {
    const updatedDays = [...days];
    const newExercise: ExerciseType = {
      id: uuidv4(),
      name: '',
      sets: 3,
      isReps: true,
      reps: 10,
      duration: '',
      distance: '',
      restInterval: '01:00',
      notes: '',
      perSide: false,
      mediaLinks: []
    };
    
    updatedDays[dayIndex].exercises.push(newExercise);
    setDays(updatedDays);
  };

  // Save the complete regimen
  const handleSaveRegimen = async () => {
    if (!regimenName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this regimen",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Generate regimen data in the format expected by the database
      const regimenData = {
        id: uuidv4(),
        name: regimenName,
        description: regimenDescription,
        startDate: days[0]?.date || new Date().toISOString().split('T')[0],
        endDate: days[days.length - 1]?.date || new Date().toISOString().split('T')[0],
        category: customCategory ? `Custom:${customCategory}` : category,
        sport: sportTag,
        level,
        days,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        originalLanguage: detectedLanguage
      };

      await onSave(regimenData);
      
      toast({
        title: "Success",
        description: "Workout plan saved successfully!",
      });
      
      // Navigate back to regimens list
      navigate('/app/regimens');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Failed to save the workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Define color mapping for all intensity options in all languages
  const intensityColorMap: Record<string, string> = {
    // English 
    'Easy': 'bg-green-100 text-green-800 border-green-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Hard': 'bg-red-100 text-red-800 border-red-200',
    'Rest': 'bg-blue-100 text-blue-800 border-blue-200',
    // Spanish
    'Fácil': 'bg-green-100 text-green-800 border-green-200',
    'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Difícil': 'bg-red-100 text-red-800 border-red-200',
    'Descanso': 'bg-blue-100 text-blue-800 border-blue-200',
    // French
    'Facile': 'bg-green-100 text-green-800 border-green-200',
    'Moyen': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Difficile': 'bg-red-100 text-red-800 border-red-200',
    'Repos': 'bg-blue-100 text-blue-800 border-blue-200',
    // German
    'Leicht': 'bg-green-100 text-green-800 border-green-200',
    'Mittel': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Schwer': 'bg-red-100 text-red-800 border-red-200',
    'Ruhe': 'bg-blue-100 text-blue-800 border-blue-200',
    // Swedish
    'Lätt': 'bg-green-100 text-green-800 border-green-200',
    'Medel': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Svår': 'bg-red-100 text-red-800 border-red-200',
    'Vila': 'bg-blue-100 text-blue-800 border-blue-200',
    // Norwegian - using different naming to avoid duplicate key with English 'Hard'
    'Lett': 'bg-green-100 text-green-800 border-green-200',
    'Middels': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Norsk_Hard': 'bg-red-100 text-red-800 border-red-200', // Norwegian Hard with different key
    'Hvile': 'bg-blue-100 text-blue-800 border-blue-200',
    // Danish
    'Let': 'bg-green-100 text-green-800 border-green-200',
    'Mellem': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Hård': 'bg-red-100 text-red-800 border-red-200',
    // Finnish
    'Helppo': 'bg-green-100 text-green-800 border-green-200',
    'Keskitaso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Kova': 'bg-red-100 text-red-800 border-red-200',
    'Lepo': 'bg-blue-100 text-blue-800 border-blue-200',
  };

  // Get color for a given intensity
  const getIntensityColor = (intensity: string) => {
    // Special case for Norwegian "Hard" which needs a different key in the map
    if (intensity === 'Hard' && detectedLanguage === 'norwegian') {
      return intensityColorMap['Norsk_Hard'];
    }
    
    if (intensityColorMap[intensity]) {
      return intensityColorMap[intensity];
    }
    
    // Default colors based on position in intensity options array
    const index = intensityOptions.findIndex(option => option === intensity);
    switch (index) {
      case 0: return 'bg-green-100 text-green-800 border-green-200'; // Easy
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Medium
      case 2: return 'bg-red-100 text-red-800 border-red-200'; // Hard
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200'; // Rest
      default: return 'bg-gray-100 text-gray-800 border-gray-200'; // Default
    }
  };

  // Add a mapping function to convert intensity values when language is changed
  const mapIntensityValue = (value: string, toEnglish: boolean): string => {
    const englishToSwedish: Record<string, string> = {
      'Easy': 'Lätt',
      'Medium': 'Medel',
      'Hard': 'Svår',
      'Rest': 'Vila'
    };
    
    const swedishToEnglish: Record<string, string> = {
      'Lätt': 'Easy',
      'Medel': 'Medium',
      'Svår': 'Hard',
      'Vila': 'Rest'
    };
    
    if (toEnglish) {
      return swedishToEnglish[value] || value;
    } else {
      return englishToSwedish[value] || value;
    }
  };

  // Update language toggle to convert intensity values
  const handleLanguageChange = (value: string) => {
    const toEnglish = value === 'english';
    setUseEnglishIntensities(toEnglish);
    
    // Update intensity values in all days
    const updatedDays = days.map(day => ({
      ...day,
      intensity: mapIntensityValue(day.intensity, toEnglish)
    }));
    
    setDays(updatedDays);
  };

  // Update language toggle UI in the component
  const renderLanguageToggle = () => (
    <div className="mb-4 flex items-center space-x-2">
      <Label htmlFor="intensity-language" className="flex items-center">
        <Languages className="h-4 w-4 mr-2" />
        Intensity Labels:
      </Label>
      <Select 
        value={useEnglishIntensities ? 'english' : detectedLanguage} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="english">English (Easy/Medium/Hard)</SelectItem>
          {detectedLanguage === 'swedish' && <SelectItem value="swedish">Swedish (Lätt/Medel/Svår)</SelectItem>}
          {detectedLanguage === 'norwegian' && <SelectItem value="norwegian">Norwegian (Lett/Middels/Hard)</SelectItem>}
          {detectedLanguage === 'danish' && <SelectItem value="danish">Danish (Let/Mellem/Hård)</SelectItem>}
          {detectedLanguage === 'finnish' && <SelectItem value="finnish">Finnish (Helppo/Keskitaso/Kova)</SelectItem>}
          {detectedLanguage === 'german' && <SelectItem value="german">German (Leicht/Mittel/Schwer)</SelectItem>}
          {detectedLanguage === 'french' && <SelectItem value="french">French (Facile/Moyen/Difficile)</SelectItem>}
          {detectedLanguage === 'spanish' && <SelectItem value="spanish">Spanish (Fácil/Medio/Difícil)</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="outline" className="flex items-center">
            <Languages className="h-3 w-3 mr-1" />
            {getLanguageDisplay(detectedLanguage)}
          </Badge>
        </div>
        <Button 
          onClick={handleSaveRegimen}
          disabled={saving}
          className="bg-coach-primary hover:bg-coach-primary/90"
        >
          {saving ? 'Saving...' : 'Save Workout Plan'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="regimen-name">Workout Name</Label>
          <Input
            id="regimen-name"
            value={regimenName}
            onChange={(e) => setRegimenName(e.target.value)}
            placeholder="Enter a name for this workout plan"
            className="mb-4"
          />
          
          <Label htmlFor="regimen-description">Description</Label>
          <Textarea
            id="regimen-description"
            value={regimenDescription}
            onChange={(e) => setRegimenDescription(e.target.value)}
            placeholder="Enter a description (optional)"
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sport-tag">Sport/Tags</Label>
              <Input
                id="sport-tag"
                value={sportTag}
                onChange={(e) => setSportTag(e.target.value)}
                placeholder="e.g., Running, Strength"
                className="mb-4"
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level" className="mb-4">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {renderLanguageToggle()}
        </div>
        
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Workout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Training Days:</span>
                  <span className="font-medium">{Array.isArray(days) ? days.length : 0}</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Total Exercises:</span>
                  <span className="font-medium">
                    {Array.isArray(days) ? days.reduce((total, day) => total + day.exercises.length, 0) : 0}
                  </span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Intensity Distribution:</span>
                  <div className="flex gap-2">
                    {Array.isArray(days) && days.length > 0 ? Object.entries(days.reduce((acc, day) => {
                      acc[day.intensity] = (acc[day.intensity] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)).map(([intensity, count]) => (
                      <Badge 
                        key={intensity} 
                        variant="outline" 
                        className={intensityColorMap[intensity] || 'bg-gray-100 text-gray-800'}
                      >
                        {intensity}: {count}
                      </Badge>
                    )) : <span className="text-gray-500">None</span>}
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Training Days ({Array.isArray(days) ? days.length : 0})</h2>
        
        {Array.isArray(days) && days.length > 0 ? days.map((day, dayIndex) => (
          <Card key={day.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {day.name} <span className="text-gray-400 text-sm">({new Date(day.date).toLocaleDateString()})</span>
                </CardTitle>
                
                <div className="flex space-x-2">
                  {intensityOptions.map((intensity) => (
                    <Badge
                      key={intensity}
                      className={`cursor-pointer ${day.intensity === intensity ? getIntensityColor(intensity) : 'bg-gray-100 text-gray-800'}`}
                      onClick={() => handleIntensityChange(dayIndex, intensity)}
                    >
                      {intensity}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {day.exercises.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">No exercises for this day</p>
                ) : (
                  day.exercises.map((exercise, exerciseIndex) => (
                    <div 
                      key={exercise.id} 
                      className="border rounded-md p-4 relative"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteExercise(dayIndex, exerciseIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="mb-3">
                        <Label htmlFor={`exercise-name-${exercise.id}`}>Exercise Name</Label>
                        <Input
                          id={`exercise-name-${exercise.id}`}
                          value={exercise.name}
                          onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'name', e.target.value)}
                          placeholder="Enter exercise name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <Label htmlFor={`sets-${exercise.id}`}>Sets</Label>
                          <Input
                            id={`sets-${exercise.id}`}
                            type="number"
                            min="0"
                            value={exercise.sets}
                            onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'sets', e.target.value)}
                          />
                        </div>
                        
                        {exercise.distance ? (
                          <div>
                            <Label htmlFor={`distance-${exercise.id}`}>Distance</Label>
                            <Input
                              id={`distance-${exercise.id}`}
                              placeholder="100m"
                              value={exercise.distance}
                              onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'distance', e.target.value)}
                            />
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor={`reps-${exercise.id}`}>Reps</Label>
                            <Input
                              id={`reps-${exercise.id}`}
                              type="number"
                              min="0"
                              value={exercise.reps}
                              onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'reps', e.target.value)}
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor={`rest-${exercise.id}`}>Rest (MM:SS)</Label>
                          <Input
                            id={`rest-${exercise.id}`}
                            placeholder="01:00"
                            value={exercise.restInterval}
                            onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'restInterval', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Label htmlFor={`notes-${exercise.id}`}>Notes</Label>
                        <Textarea
                          id={`notes-${exercise.id}`}
                          value={exercise.notes}
                          onChange={(e) => handleExerciseUpdate(dayIndex, exerciseIndex, 'notes', e.target.value)}
                          placeholder="Enter notes"
                          className="h-24"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )) : <p className="text-gray-500 italic text-center py-4">No training days</p>}
      </div>
    </div>
  );
};

export default WorkoutConfirmation;