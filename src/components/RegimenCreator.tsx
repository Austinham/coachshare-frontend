import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, parseISO, isToday, isFuture, isValid } from 'date-fns';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ColumnBasedRegimenCreator from './regimen/ColumnBasedRegimenCreator';
import { RegimenType, ExerciseType, RegimenDayType } from '@/types/regimen'; // Use RegimenDayType directly
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react'; // Simplified imports
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { regimenService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegimenColumnsType, daysToColumns, columnsToDays } from '@/types/regimen';

// Assuming RegimenType from '@/types/regimen' defines 'days' as DayType[] and DayType has a required 'intensity'
// And RegimenType.customIntensities is string[]

const getDefaultRegimen = (): RegimenType => ({
  id: 'regimen_' + Date.now(),
  name: 'New Custom Regimen',
  description: 'Detailed description of the new custom regimen.',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to one week
  days: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: 'General',
  sport: 'N/A',
  level: 'Intermediate',
  customIntensities: [],
});

interface RegimenCreatorProps {
  athleteId?: string;
  regimenId?: string; // For editing existing regimen
  onSaveSuccess: (regimen: RegimenType) => void;
  onClose?: () => void;
}

const RegimenCreator: React.FC<RegimenCreatorProps> = ({ athleteId, regimenId, onSaveSuccess, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { regimenId: paramRegimenId } = useParams<{ regimenId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [initialRegimen, setInitialRegimen] = useState<RegimenType | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [currentRegimen, setCurrentRegimen] = useState<RegimenType | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [columns, setColumns] = useState<RegimenColumnsType>(daysToColumns(currentRegimen?.days || []));
  const [error, setError] = useState<string | null>(null);
  const [customIntensities, setCustomIntensities] = useState<string[]>(currentRegimen?.customIntensities || []);
  const [newIntensity, setNewIntensity] = useState('');

  const ensureCurrentDays = useCallback((regimen: RegimenType): RegimenType => {
    let currentDays = (regimen.days || []) as RegimenDayType[]; 

    const hasCurrentOrFutureDays = currentDays.some(day => {
      if (!day.date) return false;
      try {
        const dateValue = parseISO(day.date);
        return isValid(dateValue) && (isToday(dateValue) || isFuture(dateValue));
      } catch { return false; }
    });

    // Ensure all days have an intensity; if not, it might indicate incomplete data or a different type structure.
    if (hasCurrentOrFutureDays && currentDays.every(day => typeof day.intensity === 'string' && day.intensity.trim() !== '')) {
       return { ...regimen, days: currentDays };
    }

    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    const defaultDaysToAdd: RegimenDayType[] = [
      {
        id: uuidv4(),
        name: "Today's Workout",
        date: format(today, 'yyyy-MM-dd'),
        intensity: "Moderate", 
        exercises: [
          { id: uuidv4(), name: "Bench Press", sets: 3, isReps: true, reps: 10, restInterval: "90s" } as ExerciseType,
          { id: uuidv4(), name: "Pull-ups", sets: 4, isReps: true, reps: 8, restInterval: "60s" } as ExerciseType,
        ]
      },
      {
        id: uuidv4(),
        name: "Tomorrow's Workout",
        date: format(tomorrow, 'yyyy-MM-dd'),
        intensity: "Hard", 
        exercises: [
          { id: uuidv4(), name: "Squats", sets: 4, isReps: true, reps: 8, restInterval: "120s" } as ExerciseType,
          { id: uuidv4(), name: "Deadlifts", sets: 3, isReps: true, reps: 5, restInterval: "150s" } as ExerciseType,
        ]
      }
    ];
    const allDays = [...currentDays, ...defaultDaysToAdd].map(day => ({
      ...day, 
      intensity: (day.intensity && day.intensity.trim() !== '') ? day.intensity : 'Moderate' // Ensure intensity
    })); 
    return {
      ...regimen,
      days: allDays as RegimenDayType[] 
    };
  }, []);

  useEffect(() => {
    const loadRegimen = async (id: string) => {
      setLoading(true);
      try {
        const data = await regimenService.getRegimenById(id);
        if (data && (data.id || data._id)) {
          const transformedData: RegimenType = {
            ...getDefaultRegimen(),
            ...data,
            id: data.id || data._id!,
            days: (data.days?.map((d: any) => ({ 
                ...d, 
                id: d.id || d._id || uuidv4(),
                intensity: d.intensity || 'Moderate', 
                exercises: d.exercises?.map((e:any) => ({...e, id: e.id || e._id || uuidv4()})) || []
            })) || []) as RegimenDayType[],
            customIntensities: (data.customIntensities && data.customIntensities.length > 0 ? data.customIntensities : getDefaultRegimen().customIntensities) as string[],
            startDate: data.startDate ? format(parseISO(data.startDate), 'yyyy-MM-dd') : getDefaultRegimen().startDate,
            endDate: data.endDate ? format(parseISO(data.endDate), 'yyyy-MM-dd') : getDefaultRegimen().endDate,
          };
          const regimenWithEnsuredDays = ensureCurrentDays(transformedData);
          setInitialRegimen(regimenWithEnsuredDays);
          setCurrentRegimen(regimenWithEnsuredDays); 
          setColumns(daysToColumns(regimenWithEnsuredDays.days));
          setCustomIntensities(regimenWithEnsuredDays.customIntensities);
        } else {
          toast({ title: 'Error', description: 'Failed to load valid regimen data.', variant: 'destructive' });
          const newReg = ensureCurrentDays(getDefaultRegimen());
          setInitialRegimen(newReg);
          setCurrentRegimen(newReg);
          setColumns(daysToColumns(newReg.days));
          setCustomIntensities(newReg.customIntensities);
        }
      } catch (error) {
        console.error('Error loading regimen:', error);
        toast({ title: 'Error', description: 'Failed to load regimen. Starting new.', variant: 'destructive' });
        const newReg = ensureCurrentDays(getDefaultRegimen());
        setInitialRegimen(newReg);
        setCurrentRegimen(newReg);
        setColumns(daysToColumns(newReg.days));
        setCustomIntensities(newReg.customIntensities);
      } finally {
        setLoading(false);
      }
    };

    const queryParams = new URLSearchParams(location.search);
    const queryRegimenId = queryParams.get('id');
    const regimenIdToLoad = paramRegimenId || queryRegimenId;

    if (regimenIdToLoad) {
      loadRegimen(regimenIdToLoad);
    } else {
      const newRegimen = ensureCurrentDays(getDefaultRegimen());
      setInitialRegimen(newRegimen);
      setCurrentRegimen(newRegimen);
      setColumns(daysToColumns(newRegimen.days));
      setCustomIntensities(newRegimen.customIntensities);
    }
  }, [location.search, paramRegimenId, toast, ensureCurrentDays]);

  const prepareRegimenForSave = (regimenToSave: RegimenType): any => {
    return {
      ...regimenToSave,
      days: (regimenToSave.days as RegimenDayType[]).map(day => ({
        ...day,
        intensity: day.intensity || 'Moderate', 
        exercises: day.exercises.map(ex => ({
          ...ex,
          sets: Number(ex.sets) || 0,
          reps: ex.isReps && ex.reps ? Number(ex.reps) : undefined,
          duration: !ex.isReps && ex.duration ? ex.duration : undefined, 
          distance: ex.distance ? ex.distance : undefined, 
        }))
      }))
    };
  };

  const handleSaveRegimen = async (regimenToSave: RegimenType | null) => {
    if (!regimenToSave) {
      toast({ title: 'Error', description: 'No regimen data to save.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const preparedRegimen = prepareRegimenForSave(regimenToSave);
      let savedRegimenData;
      if (initialRegimen && (initialRegimen.id || (initialRegimen as any)._id)) { 
        savedRegimenData = await regimenService.updateRegimen(preparedRegimen.id, preparedRegimen);
      } else {
        savedRegimenData = await regimenService.createRegimen(preparedRegimen);
      }
      const savedRegimenTypeFix: RegimenType = {
        ...getDefaultRegimen(),
        ...savedRegimenData,
        id: savedRegimenData.id || savedRegimenData._id,
        days: (savedRegimenData.days?.map((d:any) => ({...d, intensity: d.intensity || 'Moderate'})) || []) as RegimenDayType[],
        customIntensities: (savedRegimenData.customIntensities || getDefaultRegimen().customIntensities) as string[],
      };

      toast({ title: 'Success', description: 'Training program saved successfully!' });
      const finalRegimenState = ensureCurrentDays(savedRegimenTypeFix);
      setCurrentRegimen(finalRegimenState);
      setInitialRegimen(finalRegimenState); 
      setColumns(daysToColumns(finalRegimenState.days));
      setCustomIntensities(finalRegimenState.customIntensities);
      navigate(`/app/regimens/edit/${finalRegimenState.id}`, { replace: true }); 
      onSaveSuccess(finalRegimenState);
    } catch (error) {
      console.error('Error saving regimen:', error);
      toast({ title: 'Error Saving', description: (error as Error).message || 'Could not save training program.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRegimen = async () => {
    if (!currentRegimen || !currentRegimen.id) {
        toast({ title: "Error", description: "No regimen selected for deletion.", variant: "destructive" });
        return;
    }
    setDeleting(true);
    try {
      await regimenService.deleteRegimen(currentRegimen.id);
      toast({ title: 'Deleted', description: 'Training program deleted successfully.' });
      navigate('/app/regimens');
    } catch (error) {
      console.error('Error deleting regimen:', error);
      toast({ title: 'Error Deleting', description: (error as Error).message || 'Could not delete training program.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleColumnCreatorChange = (updatedRegimen: RegimenType) => {
    setCurrentRegimen(updatedRegimen);
    setColumns(daysToColumns(updatedRegimen.days));
    setCustomIntensities(updatedRegimen.customIntensities);
  };

  if (loading && !currentRegimen) { 
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen p-4 bg-gray-50">
        <header className="flex items-center justify-between mb-4 pb-4 border-b">
          <Button variant="ghost" onClick={() => navigate('/app/regimens')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Regimens
          </Button>
          <div className="flex items-center gap-2">
            {currentRegimen && currentRegimen.id && (
              <Button variant="outline" onClick={() => setShowDeleteAlert(true)} disabled={deleting || isSaving}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
            <Button onClick={() => handleSaveRegimen(currentRegimen)} disabled={isSaving || deleting || !currentRegimen} className="bg-coach-primary hover:bg-coach-primary/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Program
            </Button>
          </div>
        </header>

        {currentRegimen ? (
          <ColumnBasedRegimenCreator 
            initialRegimen={currentRegimen} 
            onChange={handleColumnCreatorChange} 
            onSave={() => handleSaveRegimen(currentRegimen)} 
          />
        ) : (
           <div className="flex justify-center items-center h-full">
              {loading ? <Loader2 className="h-12 w-12 animate-spin" /> : <p>Loading regimen editor...</p>}
          </div>
        )}

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the training program "{currentRegimen?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteAlert(false)} disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRegimen} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete Program'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndProvider>
  );
};

export default RegimenCreator;
