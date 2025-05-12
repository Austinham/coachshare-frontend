import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, parseISO, isAfter } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, DropResult, Draggable, Droppable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, Save, ViewIcon, Trash2, Loader2, Sparkles, LineChart, Check, X } from 'lucide-react';
import IntensityColumn from './IntensityColumn';
import DayEditor from './DayEditor';
import { RegimenType, RegimenDayType, IntensityLevel, RegimenColumnsType, columnsToDays, ExerciseType } from '@/types/regimen';
import TableView from './TableView';
import ListView from './ListView';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColumnBasedRegimenCreatorProps {
  initialRegimen?: RegimenType;
  onSave: (regimen: RegimenType) => void;
  onChange?: (regimen: RegimenType) => void;
}

const ColumnBasedRegimenCreator: React.FC<ColumnBasedRegimenCreatorProps> = ({
  initialRegimen,
  onSave,
  onChange
}) => {
  // Default empty regimen
  const defaultRegimen: RegimenType = {
    id: uuidv4(),
    name: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setDate(new Date().getDate() + 6)), 'yyyy-MM-dd'),
    days: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: 'General',
    sport: initialRegimen?.sport !== undefined ? initialRegimen.sport : (localStorage.getItem('lastUsedSportTag') || ''),
    level: 'Beginner'
  };

  // State
  const [regimen, setRegimen] = useState<RegimenType>(initialRegimen || defaultRegimen);
  const [customIntensities, setCustomIntensities] = useState<string[]>(initialRegimen?.customIntensities || []);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const standard = ['Easy', 'Medium', 'Hard', 'Rest'];
    const custom = initialRegimen?.customIntensities || [];
    return [...standard, ...custom.filter(ci => !standard.includes(ci))];
  });
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewView, setPreviewView] = useState<'list' | 'table'>('list');
  const [editingDay, setEditingDay] = useState<RegimenDayType | null>(null);
  const [isDayEditorOpen, setIsDayEditorOpen] = useState(false);
  const [newCustomIntensity, setNewCustomIntensity] = useState('');
  const [isAddingCustomIntensity, setIsAddingCustomIntensity] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>('Medium');
  const [showProgramAnalysis, setShowProgramAnalysis] = useState(false);
  const [programAnalysis, setProgramAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- Centralized State Update Logic --- START --- 
  
  // Helper to update regimen state and notify parent
  // useCallback to prevent unnecessary re-renders if passed down
  const updateRegimenAndNotify = useCallback((newRegimenData: Partial<RegimenType>, currentCustomIntensities: string[]) => {
    setRegimen(prevRegimen => {
      const updatedRegimen = {
        ...JSON.parse(JSON.stringify(prevRegimen)), // Deep copy
        ...newRegimenData, // Apply partial updates
        updatedAt: new Date().toISOString(),
        customIntensities: currentCustomIntensities // Use passed-in custom intensities
      };
      return updatedRegimen; // Return the new state for setRegimen
    });
  }, []); // Remove onChange from dependencies

  // Effect to notify parent when regimen changes
  useEffect(() => {
    // Only notify parent if onChange exists and component is mounted
    if (onChange && regimen) {
      // Ensure customIntensities is an array before sending it
      const safeCustomIntensities = Array.isArray(regimen.customIntensities) 
        ? regimen.customIntensities 
        : [];
      
      const safeRegimen = {
        ...regimen,
        customIntensities: safeCustomIntensities
      };
      
      onChange(safeRegimen);
    }
  }, [regimen, onChange]);
  
  // --- Centralized State Update Logic --- END --- 

  // Update regimen field (like name, description, dates)
  const updateRegimenField = (field: keyof RegimenType, value: any) => {
    // Use the helper, passing the specific field update and the CURRENT customIntensities state
    updateRegimenAndNotify({ [field]: value }, customIntensities);
  };

  // Helper function to convert days array to columns
  const daysToColumns = (days: RegimenDayType[], currentColumnOrder: string[]): RegimenColumnsType => {
    // Initialize with standard keys and any custom keys from the order
    const result: RegimenColumnsType = {
        Easy: [],
        Medium: [],
        Hard: [],
        Rest: [],
    };
    currentColumnOrder.forEach(intensity => {
        if (!result[intensity]) { // Add custom intensity keys if not standard
            result[intensity] = [];
        }
    });

    days.forEach(day => {
      const { intensity } = day;
      if (!result[intensity]) {
        console.warn(`Intensity "${intensity}" found in day but not in columnOrder/standard keys. Adding column dynamically.`);
        result[intensity] = []; // Add column if missing
      }
      result[intensity].push(day);
    });

    // Sort each column by date
    Object.keys(result).forEach(intensity => {
      result[intensity].sort((a, b) => a.date.localeCompare(b.date));
    });
    return result;
  };

  // Convert columns back to a flat array of days
  const columnsToDays = (cols: RegimenColumnsType): RegimenDayType[] => {
    return Object.values(cols).flat();
  };

  // Initialize columns state based on initial regimen and derived column order
  const [columns, setColumns] = useState<RegimenColumnsType>(() => 
      daysToColumns(initialRegimen?.days || [], columnOrder)
  );

  // Effect to initialize state properly when initialRegimen loads
  useEffect(() => {
    if (!initialRegimen) return;
    console.log("⚙️ Initializing component state from initialRegimen:", initialRegimen.id);
    
    const initialDays = initialRegimen.days || [];
    const initialCustomIntensities = initialRegimen.customIntensities || [];
    const standard = ['Easy', 'Medium', 'Hard', 'Rest'];
    const initialColumnOrder = [...standard, ...initialCustomIntensities.filter(ci => !standard.includes(ci))];
    
    setRegimen(initialRegimen);
    setCustomIntensities(initialCustomIntensities);
    setColumnOrder(initialColumnOrder);
    setColumns(daysToColumns(initialDays, initialColumnOrder));
    
    console.log("⚙️ Initial State Set: customIntensities=", initialCustomIntensities, "columnOrder=", initialColumnOrder);
    
  }, [initialRegimen]); // Rerun only when initialRegimen changes

  useEffect(() => {
    // Make sure all custom intensities are in the order array
    const missingIntensities = customIntensities.filter(
      intensity => !columnOrder.includes(intensity)
    );
    
    if (missingIntensities.length > 0) {
      setColumnOrder([...columnOrder, ...missingIntensities]);
    }
  }, [customIntensities, columnOrder]);

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    const { source, destination, draggableId } = result;

    if (!destination) return; // Dropped outside a list

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return; // Dropped in the same place
    }

    const startColumnId = source.droppableId as keyof RegimenColumnsType;
    const finishColumnId = destination.droppableId as keyof RegimenColumnsType;
    
    const startColumn = columns[startColumnId] || [];
    const finishColumn = columns[finishColumnId] || [];

    // Find the dragged day
    const draggedDay = startColumn.find(day => day.id === draggableId);
    if (!draggedDay) return;

    // Update the day's intensity based on the destination column
    // Explicitly cast finishColumnId to string to satisfy RegimenDayType
    const updatedDraggedDay: RegimenDayType = { ...draggedDay, intensity: String(finishColumnId) };

    const newColumns = { ...columns };

    // Moving within the same column
    if (startColumnId === finishColumnId) {
      const newDays = Array.from(startColumn);
      newDays.splice(source.index, 1);
      newDays.splice(destination.index, 0, updatedDraggedDay);
      newColumns[startColumnId] = newDays.sort((a, b) => a.date.localeCompare(b.date)); // Re-sort
    } else {
      // Moving to a different column
      const newStartDays = Array.from(startColumn);
      newStartDays.splice(source.index, 1);
      newColumns[startColumnId] = newStartDays.sort((a, b) => a.date.localeCompare(b.date)); // Re-sort

      const newFinishDays = Array.from(finishColumn);
      newFinishDays.splice(destination.index, 0, updatedDraggedDay);
      newColumns[finishColumnId] = newFinishDays.sort((a, b) => a.date.localeCompare(b.date)); // Re-sort
    }

    setColumns(newColumns);
    const updatedDays = columnsToDays(newColumns);
    // Use the helper, passing the updated days and the CURRENT customIntensities state
    updateRegimenAndNotify({ days: updatedDays }, customIntensities);
    console.log("DragEnd: Days updated", updatedDays);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Add a new day
  const handleAddDay = (intensity: IntensityLevel) => {
    // Generate a unique ID for the new day
    const uniqueDayId = uuidv4();
    
    setSelectedIntensity(intensity);
    setEditingDay({
      id: uniqueDayId,
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      intensity: intensity,
      exercises: []
    });
    setIsDayEditorOpen(true);
  };

  // Edit a day
  const handleEditDay = (dayId: string) => {
    const dayToEdit = Object.values(columns).flat().find(day => day.id === dayId);
    if (dayToEdit) {
      setEditingDay(dayToEdit);
      setIsDayEditorOpen(true);
    }
  };

  // Delete a day
  const handleDeleteDay = (dayId: string) => {
    let dayFound = false;
    const newColumns = { ...columns };

    // Find and remove the day from its column
    for (const intensity in newColumns) {
        const index = newColumns[intensity].findIndex(day => day.id === dayId);
        if (index > -1) {
            newColumns[intensity].splice(index, 1);
            dayFound = true;
            break; // Exit loop once day is found and removed
        }
    }

    if (dayFound) {
        setColumns(newColumns);
        const updatedDays = columnsToDays(newColumns);
        // Use the helper, passing updated days and CURRENT customIntensities
        updateRegimenAndNotify({ days: updatedDays }, customIntensities);
        console.log("Day deleted:", dayId);
    } else {
        console.warn("Attempted to delete day not found:", dayId);
    }
  };

  // Save a day
  const handleSaveDay = (day: RegimenDayType) => {
    const updatedColumns = { ...columns };
    let dayUpdated = false;
    let originalIntensity: keyof RegimenColumnsType | null = null;

    // Check if day exists and remove from old position if intensity changed
    Object.keys(updatedColumns).forEach((intensityKey) => {
        const index = updatedColumns[intensityKey].findIndex(d => d.id === day.id);
        if (index > -1) {
            originalIntensity = intensityKey as keyof RegimenColumnsType;
            if (originalIntensity !== day.intensity) {
                updatedColumns[originalIntensity].splice(index, 1); // Remove from old column
            }
        }
    });

    // Add/Update in the new column
    const targetIntensity = day.intensity as keyof RegimenColumnsType;
    if (!updatedColumns[targetIntensity]) {
        updatedColumns[targetIntensity] = []; // Ensure column exists
    }
    const targetIndex = updatedColumns[targetIntensity].findIndex(d => d.id === day.id);
    if (targetIndex > -1) {
        updatedColumns[targetIntensity][targetIndex] = day; // Update existing
    } else {
        updatedColumns[targetIntensity].push(day); // Add new
    }
    
    // Sort the target column
    updatedColumns[targetIntensity].sort((a, b) => a.date.localeCompare(b.date));

    setColumns(updatedColumns);
    const updatedDays = columnsToDays(updatedColumns);
    // Use the helper, passing updated days and CURRENT customIntensities
    updateRegimenAndNotify({ days: updatedDays }, customIntensities);
    
    setIsDayEditorOpen(false);
    setEditingDay(null);
    console.log("Day saved/updated:", day);
  };

  // Handle final save of the entire regimen
  const handleSaveRegimen = () => {
    try {
      // Convert columns back to days array
      const updatedDays = columnsToDays(columns);
      
      // Check if there are any workout days
      if (updatedDays.length === 0) {
        toast({
          title: 'Cannot Save Empty Program',
          description: 'Please add at least one workout day before saving.',
          variant: 'destructive',
        });
        return; // Stop execution if no days
      }
      
      // Validate days - ensure all days have a name and a unique ID
      const validatedDays = updatedDays.map(day => {
        // Ensure a unique ID for each day
        const uniqueId = day.id || uuidv4();
        
        // If day name is empty, set a default name based on date
        if (!day.name || day.name.trim() === '') {
          return {
            ...day,
            id: uniqueId,
            name: `Workout ${format(parseISO(day.date), 'MMM d')}`,
          };
        }
        
        return {
          ...day,
          id: uniqueId,
        };
      });
      
      // Make a fresh copy of customIntensities to avoid reference issues
      // Ensure it's an array, even if undefined or null
      const updatedCustomIntensities = Array.isArray(customIntensities) 
        ? [...customIntensities] 
        : [];
      
      console.log("[handleSaveRegimen] Custom intensities being saved:", updatedCustomIntensities);
      
      // Keep the exact sport value the user entered
      const updatedRegimen: RegimenType = {
        ...regimen,
        days: validatedDays,
        customIntensities: updatedCustomIntensities,
        updatedAt: new Date().toISOString()
      };
      
      console.log("[handleSaveRegimen] Final regimen with custom intensities:", 
        { id: updatedRegimen.id, customIntensities: updatedRegimen.customIntensities });
      
      // Notify parent component of changes
      if (onChange) {
        console.log(`onChange callback from handleSaveRegimen with customIntensities: ${JSON.stringify(updatedRegimen.customIntensities)}`);
        onChange(updatedRegimen);
      }
      
      // Use onSave to save the regimen
      onSave(updatedRegimen);
    } catch (error) {
      console.error('Error in handleSaveRegimen:', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your program',
        variant: 'destructive',
      });
    }
  };

  const analyzeProgram = async () => {
    try {
      setLoadingAnalysis(true);
      
      // Convert columns back to days array for analysis
      const days = columnsToDays(columns);
      const regimenForAnalysis = {
        ...regimen,
        days
      };
      
      const response = await fetch('/api/analyze-regimen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regimen: regimenForAnalysis })
      });
      
      if (!response.ok) throw new Error('Failed to analyze program');
      
      const analysis = await response.json();
      setProgramAnalysis(analysis);
      setShowProgramAnalysis(true);
    } catch (error) {
      console.error('Error analyzing program:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze training program",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Debugging useEffects (keep or remove as needed)
  useEffect(() => {
    console.log("🔄 Regimen state updated in ColumnBasedRegimenCreator:", regimen);
  }, [regimen]); 

  useEffect(() => {
    console.log("🔄 Custom Intensities state updated:", customIntensities);
  }, [customIntensities]);

  useEffect(() => {
      console.log("🔄 Columns state updated:", columns);
  }, [columns]);

  useEffect(() => {
      console.log("🔄 Column Order state updated:", columnOrder);
  }, [columnOrder]);
  
  // Log the disabled state right before rendering the button
  const isGenerateButtonDisabled = false;
  
  const handleAddCustomIntensity = () => {
    console.log("➕ ADDING CUSTOM INTENSITY:", newCustomIntensity);
    
    // Validate input
    if (!newCustomIntensity.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an intensity name',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for duplicates
    if (customIntensities.includes(newCustomIntensity)) {
      toast({
        title: 'Error',
        description: 'This intensity already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Update local state arrays
      const newCustomIntensitiesArray = [...customIntensities, newCustomIntensity];
      console.log("➕ New custom intensities array:", newCustomIntensitiesArray);
      
      // 2. Update all state immediately for immediate UI feedback
      setCustomIntensities(newCustomIntensitiesArray);
      setColumnOrder(prev => [...prev, newCustomIntensity]);
      setColumns(prev => ({
        ...prev,
        [newCustomIntensity]: []
      }));
      
      // 3. Update regimen with new custom intensities
      const updatedRegimen = {
        ...regimen,
        customIntensities: newCustomIntensitiesArray,
        updatedAt: new Date().toISOString()
      };
      setRegimen(updatedRegimen);
      
      // 4. Clear input and hide form
      setNewCustomIntensity('');
      setIsAddingCustomIntensity(false);
      
      // 5. Show success message
      toast({
        title: 'Success',
        description: `Added "${newCustomIntensity}" as a custom intensity. Remember to click "Save Program" to save your changes.`,
      });
      
      // 6. Notify parent of changes
      if (onChange) {
        onChange(updatedRegimen);
      }
      
    } catch (error) {
      console.error("❌ Error adding custom intensity:", error);
      toast({
        title: 'Error',
        description: 'Failed to add custom intensity',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCustomIntensity = (intensity: string) => {
    setCustomIntensities(customIntensities.filter(i => i !== intensity));
  };

  // Reset state when switching to overview tab
  useEffect(() => {
    if (activeTab === "preview") {
      setIsGenerating(false);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header section with improved visual design */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              <span>{initialRegimen ? 'Edit Workout Program' : 'Create New Workout Program'}</span>
              {initialRegimen && <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">Editing</Badge>}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-600">Program Name</Label>
                <Input
                  id="name"
                  placeholder="Weekly Running Plan"
                  value={regimen.name}
                  onChange={(e) => updateRegimenField('name', e.target.value)}
                  className="border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-slate-600">Category</Label>
                <Select 
                  value={regimen.category} 
                  onValueChange={(value) => {
                    if (value === "Custom") {
                      // Show custom input field if Custom is selected
                      setIsAddingCustomIntensity(true);
                    } else {
                      updateRegimenField('category', value);
                    }
                  }}
                >
                  <SelectTrigger id="category" className="border-slate-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength & Conditioning">Strength & Conditioning</SelectItem>
                    <SelectItem value="Endurance">Endurance</SelectItem>
                    <SelectItem value="Flexibility & Mobility">Flexibility & Mobility</SelectItem>
                    <SelectItem value="Sport Specific">Sport Specific</SelectItem>
                    <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                    <SelectItem value="General Fitness">General Fitness</SelectItem>
                    <SelectItem value="Custom">Add Custom Category...</SelectItem>
                  </SelectContent>
                </Select>
                
                {isAddingCustomIntensity && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Enter custom category"
                      value={newCustomIntensity}
                      onChange={(e) => setNewCustomIntensity(e.target.value)}
                      className="border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (newCustomIntensity.trim()) {
                          const customCategory = `Custom:${newCustomIntensity.trim()}`;
                          updateRegimenField('category', customCategory);
                          setNewCustomIntensity('');
                          setIsAddingCustomIntensity(false);
                        }
                      }}
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingCustomIntensity(false);
                        setNewCustomIntensity('');
                      }}
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sport" className="text-sm font-medium text-slate-600">Sport</Label>
                <Input
                  id="sport"
                  placeholder="Running, Soccer, etc."
                  value={regimen.sport || ''}
                  onChange={(e) => updateRegimenField('sport', e.target.value)}
                  className="border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium text-slate-600">Experience Level</Label>
                <Select 
                  value={regimen.level || 'Beginner'} 
                  onValueChange={(value) => updateRegimenField('level', value)}
                >
                  <SelectTrigger id="level" className="border-slate-200">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-600">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the goals and focus of this program..."
                value={regimen.description}
                onChange={(e) => updateRegimenField('description', e.target.value)}
                className="h-24 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-slate-200 hover:bg-slate-50">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {regimen.startDate && typeof regimen.startDate === 'string' 
                        ? format(parseISO(regimen.startDate), 'PPP') 
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={regimen.startDate && typeof regimen.startDate === 'string' ? parseISO(regimen.startDate) : undefined}
                      onSelect={(date) => date && updateRegimenField('startDate', format(date, 'yyyy-MM-dd'))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal border-slate-200 hover:bg-slate-50">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {regimen.endDate && typeof regimen.endDate === 'string' 
                        ? format(parseISO(regimen.endDate), 'PPP') 
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={regimen.endDate && typeof regimen.endDate === 'string' ? parseISO(regimen.endDate) : undefined}
                      onSelect={(date) => date && updateRegimenField('endDate', format(date, 'yyyy-MM-dd'))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs section with improved design */}
      <Tabs defaultValue="edit" value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="edit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Preview
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveRegimen}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" /> Save Program
            </Button>
          </div>
        </div>
        
        <TabsContent value="edit" className="mt-0">
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCustomIntensity(!isAddingCustomIntensity)}
                  className="text-sm border-slate-200 hover:bg-slate-50"
                >
                  + Custom Intensity
                </Button>
              </div>
            </div>
            
            {isAddingCustomIntensity && (
              <div className="flex gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Input
                  placeholder="New intensity level name"
                  value={newCustomIntensity}
                  onChange={(e) => setNewCustomIntensity(e.target.value)}
                  className="border-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCustomIntensity.trim()) {
                      e.preventDefault();
                      handleAddCustomIntensity();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Add Intensity button clicked!");
                    handleAddCustomIntensity();
                  }}
                  disabled={!newCustomIntensity.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  Add Intensity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingCustomIntensity(false);
                    setNewCustomIntensity('');
                  }}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {/* Display custom intensities with remove buttons - ENHANCED PROMINENT STYLING */}
            {customIntensities.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Custom Intensities: ({customIntensities.length}) 
                  {JSON.stringify(customIntensities)}
                </h3>
                <div className="flex flex-wrap gap-2 p-3 bg-purple-100 border-2 border-purple-300 rounded-md">
                  {customIntensities.map(intensity => (
                    <div key={intensity} className="flex items-center gap-1 bg-white text-purple-800 px-3 py-2 rounded-full border border-purple-400 shadow hover:shadow-md transition-shadow">
                      <span className="font-bold">{intensity}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCustomIntensity(intensity);
                        }}
                        className="ml-1 text-purple-600 hover:text-purple-800 bg-purple-50 rounded-full p-1"
                        type="button"
                        aria-label={`Remove ${intensity} intensity`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Droppable 
              droppableId="all-columns" 
              direction="horizontal" 
              type="COLUMN"
              mode="standard"
              isDropDisabled={false}
            >
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-4 overflow-x-auto pb-4"
                >
                  {columnOrder.map((intensity, index) => {
                    const days = columns[intensity] || [];
                    return (
                      <Draggable 
                        key={intensity} 
                        draggableId={intensity} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? 'opacity-70' : ''}`}
                          >
                            <IntensityColumn
                              intensity={intensity as IntensityLevel}
                              days={days}
                              onAddDay={handleAddDay}
                              onEditDay={handleEditDay}
                              onDeleteDay={handleDeleteDay}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>
        
        <TabsContent value="preview" className="bg-white p-6 border rounded-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{regimen.name || 'Untitled Program'}</h2>
            <p className="text-gray-500 mt-1">{regimen.description || 'No description provided'}</p>
            
            <div className="flex flex-wrap mt-4 gap-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm">
                  {new Date(regimen.startDate).toLocaleDateString()} - {new Date(regimen.endDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-1">
                  {(regimen.category && regimen.category.startsWith('Custom:')) 
                    ? regimen.category.substring(7) 
                    : (regimen.category || 'Uncategorized')}
                </Badge>
                <span className="text-sm text-muted-foreground">Category</span>
              </div>

              {regimen.sport && (
                <div className="flex items-center">
                  <div className="flex flex-wrap gap-1">
                    {regimen.sport.split(',').map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-blue-50"
                      >
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground ml-1">Sport/Tags</span>
                </div>
              )}
              
              {regimen.level && (
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-purple-50">
                    {regimen.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-1">Level</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {['Easy', 'Medium', 'Hard', 'Rest', ...customIntensities].map(intensity => (
                  <Badge 
                    key={intensity} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {intensity}: {columns[intensity]?.length || 0} days
                  </Badge>
                ))}
              </div>
              
              {/* Total exercises badge */}
              <div className="flex items-center">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {Object.values(columns).flat().reduce((total, day) => total + (day.exercises?.length || 0), 0)} exercises
                </Badge>
                <span className="text-sm text-muted-foreground ml-1">Total</span>
              </div>
            </div>
          </div>
          
          {/* Preview as list or table */}
          {previewView === 'list' ? (
            <ListView columns={columns} />
          ) : (
            <TableView columns={columns} />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Day Editor Dialog */}
      <DayEditor
        isOpen={isDayEditorOpen}
        onClose={() => setIsDayEditorOpen(false)}
        day={editingDay}
        onSave={handleSaveDay}
        defaultIntensity={selectedIntensity}
        customIntensities={customIntensities}
      />

      <Dialog open={showProgramAnalysis} onOpenChange={setShowProgramAnalysis}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Training Program Analysis</DialogTitle>
            <DialogDescription>
              AI-powered feedback on your workout design
            </DialogDescription>
          </DialogHeader>
          
          {programAnalysis && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h3 className="text-lg font-medium">Overall Assessment</h3>
                <p className="text-sm text-muted-foreground">{programAnalysis.overallAssessment}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Program Strengths</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {programAnalysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="text-green-600 dark:text-green-400">
                      <span className="text-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Suggested Improvements</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {programAnalysis.improvements.map((improvement: string, i: number) => (
                    <li key={i} className="text-amber-600 dark:text-amber-400">
                      <span className="text-foreground">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Progressive Overload Ideas</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {programAnalysis.progressionIdeas.map((idea: string, i: number) => (
                    <li key={i} className="text-blue-600 dark:text-blue-400">
                      <span className="text-foreground">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Balance Analysis</h3>
                <p className="text-sm text-muted-foreground">{programAnalysis.balanceAnalysis}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setShowProgramAnalysis(false)}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Insights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColumnBasedRegimenCreator; 