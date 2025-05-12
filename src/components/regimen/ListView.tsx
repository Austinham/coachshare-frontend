import React, { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { RegimenColumnsType } from '@/types/regimen';

interface ListViewProps {
  columns: RegimenColumnsType;
}

const ListView: React.FC<ListViewProps> = ({ columns }) => {
  // State to track which day's details dialog is open
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  
  // Collect all days from all columns
  const allDays = Object.entries(columns).flatMap(([intensity, days]) => 
    days.map(day => ({ ...day, intensity }))
  );

  // Sort days by date
  const sortedDays = [...allDays].sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Format exercise count type (reps, time, or distance)
  const formatExerciseCount = (exercise: any) => {
    let formatted = '';
    
    if (exercise.isReps) {
      formatted = `${exercise.reps} reps`;
    } else if (exercise.distance && exercise.distance.trim() !== '') {
      formatted = exercise.distance;
    } else {
      formatted = exercise.duration;
    }
    
    if (exercise.perSide) {
      formatted += ' (per side)';
    }
    
    return formatted;
  };
  
  // Find the selected day
  const selectedDay = selectedDayId 
    ? sortedDays.find(day => day.id === selectedDayId) 
    : null;

  if (sortedDays.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No training days added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedDays.map(day => {
          const date = parseISO(day.date);
          const isValidDate = isValid(date);
          const dayOfWeek = isValidDate ? format(date, 'EEEE') : 'Unknown';
          const formattedDate = isValidDate ? format(date, 'MMM d, yyyy') : day.date;
          
          return (
            <Card key={day.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getIntensityColor(day.intensity)}>
                        {day.intensity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formattedDate} • {dayOfWeek}
                      </span>
                    </div>
                    <CardTitle className="mt-1">{day.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="cursor-default">
                    {day.exercises.length} exercises
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {day.exercises.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Exercises</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => setSelectedDayId(day.id)}
                      >
                        View Details <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <ul className="space-y-3">
                      {day.exercises.slice(0, 3).map(exercise => (
                        <li key={exercise.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{exercise.name || 'Unnamed Exercise'}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center">
                              {exercise.sets} × {formatExerciseCount(exercise)}
                            </span>
                          </div>
                          {exercise.notes && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground text-xs">Notes:</span> {exercise.notes}
                            </div>
                          )}
                        </li>
                      ))}
                      
                      {day.exercises.length > 3 && (
                        <li className="text-center text-xs text-muted-foreground">
                          +{day.exercises.length - 3} more exercises
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No exercises added</p>
                )}
              </CardContent>
              {(day.exercises.some(ex => ex.perSide) || day.exercises.some(ex => !ex.isReps) || day.exercises.some(ex => ex.notes)) && (
                <CardFooter className="pt-0 flex gap-2 flex-wrap">
                  {day.exercises.some(ex => ex.perSide) && (
                    <Badge variant="secondary" className="text-xs">Per Side Exercises</Badge>
                  )}
                  {day.exercises.some(ex => !ex.isReps) && (
                    <Badge variant="secondary" className="text-xs">Distance Exercises</Badge>
                  )}
                  {day.exercises.some(ex => ex.notes) && (
                    <Badge variant="secondary" className="text-xs">Has Notes</Badge>
                  )}
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Detailed Exercise View Dialog */}
      <Dialog open={!!selectedDayId} onOpenChange={(open) => !open && setSelectedDayId(null)}>
        {selectedDay && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <div>
                  {selectedDay.name}
                  <div className="text-sm font-normal text-muted-foreground mt-1">
                    {format(parseISO(selectedDay.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
                <Badge variant="outline" className={getIntensityColor(selectedDay.intensity)}>
                  {selectedDay.intensity}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-3">Exercises</h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Exercise</TableHead>
                    <TableHead>Sets</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Rest</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDay.exercises.map((exercise, index) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">
                        <div>
                          {exercise.name || `Exercise ${index + 1}`}
                          {exercise.perSide && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-800 border-blue-200">
                              Per Side
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{exercise.sets}</TableCell>
                      <TableCell>{formatExerciseCount(exercise)}</TableCell>
                      <TableCell>{exercise.restInterval}</TableCell>
                      <TableCell className="max-w-[300px]">
                        {exercise.notes ? (
                          <span className="text-wrap break-words">
                            {exercise.notes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedDayId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

// Helper function to get color based on intensity
function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'Easy':
      return 'text-green-500 border-green-500';
    case 'Medium':
      return 'text-yellow-500 border-yellow-500';
    case 'Hard':
      return 'text-red-500 border-red-500';
    case 'Rest':
      return 'text-blue-500 border-blue-500';
    default:
      return 'text-purple-500 border-purple-500';
  }
}

export default ListView; 