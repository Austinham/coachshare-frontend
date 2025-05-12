import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, startOfWeek, endOfWeek, addWeeks, addMonths, startOfMonth, endOfMonth, isSameDay, compareAsc, addDays } from 'date-fns';
import { Calendar, Clock, ArrowRight, CalendarIcon, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { regimenService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Keep the enhanced date parsing helper
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date from parseISO');
    return date;
  } catch (e) {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const parsedDate = new Date(Date.UTC(year, month - 1, day));
         if (isNaN(parsedDate.getTime())) return null;
         return parsedDate;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (e2) {
      return null;
    }
  }
};

// Define interfaces for clarity
interface ScheduleDay {
    date: Date;
    name: string;
    intensity?: string;
    exercises: any[];
    regimenId: string;
    regimenName: string;
    assignedTo: string[]; 
}

interface GroupedSchedule {
    [key: string]: ScheduleDay[];
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch and process schedule data
  const loadSchedule = async () => {
    if (!user) {
        console.log("No user found, cannot load schedule.");
        setLoading(false);
        return;
    }
    console.log('Loading schedule data...');
    setLoading(true);
    try {
      const regimens = await regimenService.getCoachScheduleRegimens();
      const days: ScheduleDay[] = [];
      
      regimens.forEach(regimen => {
        if (regimen.days && Array.isArray(regimen.days)) {
          regimen.days.forEach((day: any) => {
            const parsedDate = safeParseISO(day.date);
            if (parsedDate) {
              days.push({
                date: parsedDate,
                name: day.name || 'Unnamed Workout',
                intensity: day.intensity,
                exercises: day.exercises || [],
                regimenId: regimen._id || regimen.id,
                regimenName: regimen.name || 'Unnamed Regimen',
                assignedTo: regimen.assignedTo || []
              });
            }
          });
        }
      });

      days.sort((a, b) => compareAsc(a.date, b.date));
      console.log(`Processed ${days.length} schedule days.`);
      setScheduleDays(days);

    } catch (error) {
      console.error('Error loading schedule in component:', error);
      setScheduleDays([]);
    } finally {
      setLoading(false);
    }
  };

  // Load schedule on mount or when user changes
  useEffect(() => {
    loadSchedule();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadSchedule();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Group schedule days for rendering
  const groupedSchedule = useMemo(() => {
    const groups: GroupedSchedule = {
      Today: [],
      Tomorrow: [],
      'This Week': [],
      'Next Week': [],
      'This Month': [],
      'Future': [],
    };
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startOfNextWeek = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const endOfNextWeek = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);

    scheduleDays.forEach(day => {
        // Skip days in the past relative to the start of today
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (day.date < startOfToday) return;

        if (isSameDay(day.date, now)) groups.Today.push(day);
        else if (isSameDay(day.date, tomorrow)) groups.Tomorrow.push(day);
        // Ensure 'This Week' doesn't include Today or Tomorrow if they are separate groups
        else if (day.date >= addDays(startOfThisWeek, 2) && day.date <= endOfThisWeek) groups['This Week'].push(day);
        else if (day.date >= startOfNextWeek && day.date <= endOfNextWeek) groups['Next Week'].push(day);
        // Adjust 'This Month' to exclude days already categorized
        else if (day.date > endOfNextWeek && day.date >= startOfThisMonth && day.date <= endOfThisMonth) groups['This Month'].push(day);
        else if (day.date > endOfThisMonth) groups.Future.push(day);
    });
    
    // Sort days within each group
    for (const key in groups) {
        groups[key].sort((a, b) => compareAsc(a.date, b.date));
    }

    return groups;
  }, [scheduleDays]);

  // Format date for display
  const formatDateHeading = (date: Date): string => {
    if (isToday(date)) return 'Today';
    const tomorrow = addDays(new Date(), 1);
    if (isSameDay(date, tomorrow)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d'); // e.g., Tuesday, July 16
  };

  // --- Render Logic --- 

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-coach-primary" />
      </div>
    );
  }

  const hasScheduleDays = Object.values(groupedSchedule).some(days => days.length > 0);

  if (!hasScheduleDays) {
  return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center">
        <CalendarIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">No Upcoming Scheduled Workouts</h2>
        <p className="text-gray-500">Assign dates to workout days within your regimens.</p>
        {user?.role === 'coach' && (
          <Button className="mt-4" onClick={() => navigate('/app/regimens')}>
            Go to Regimens
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Schedule</h1>
      
      {Object.entries(groupedSchedule).map(([groupName, days]) => (
        days.length > 0 && (
          <section key={groupName} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">{groupName}</h2>
            {days.map((day, index) => (
              <Card 
                key={`${day.regimenId}-${day.date.toISOString()}-${index}`}
                className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                // TODO: Update navigation for coach view if needed
                onClick={() => navigate(`/app/regimens/create?id=${day.regimenId}`)} 
              >
                <CardHeader className="p-4 bg-gray-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800">{day.regimenName}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                         {day.name} - {formatDateHeading(day.date)}
                  </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                       {day.intensity && <Badge variant="outline">{day.intensity}</Badge>}
                       <div className="flex items-center" title={`${day.assignedTo.length} assigned athlete(s)`}>
                         <Users className="h-4 w-4 mr-1" />
                         <span>{day.assignedTo.length}</span>
                                  </div>
                                </div>
                                        </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {day.exercises.slice(0, 3).map((ex, exIndex) => (
                    <div key={ex.id || exIndex} className="flex justify-between items-center text-sm text-gray-700">
                      <span>{ex.name}</span>
                      <span className="text-gray-500">
                        {ex.sets} sets {ex.is_reps ? `x ${ex.reps} reps` : ex.duration ? `for ${ex.duration}`: ''} 
                                        </span>
                                      </div>
                  ))}
                  {day.exercises.length > 3 && (
                    <div className="text-sm text-gray-500 text-center">...and {day.exercises.length - 3} more</div>
                  )}
                  {day.exercises.length === 0 && (
                      <div className="text-sm text-gray-500 italic">No exercises listed for this day.</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )
      ))}
    </div>
  );
};

export default Schedule;
