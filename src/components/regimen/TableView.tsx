import React, { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RegimenColumnsType } from '@/types/regimen';

interface TableViewProps {
  columns: RegimenColumnsType;
}

interface ExerciseNote {
  dayName: string;
  exerciseName: string;
  notes: string;
}

const TableView: React.FC<TableViewProps> = ({ columns }) => {
  // State for the notes dialog
  const [selectedNote, setSelectedNote] = useState<ExerciseNote | null>(null);

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

  // Show the full notes for an exercise
  const showFullNotes = (dayName: string, exerciseName: string, notes: string) => {
    setSelectedNote({
      dayName,
      exerciseName,
      notes
    });
  };

  return (
    <>
      <Table>
        <TableCaption>Training Schedule</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Intensity</TableHead>
            <TableHead>Training</TableHead>
            <TableHead className="text-center">Exercises</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDays.map(day => {
            const date = parseISO(day.date);
            const isValidDate = isValid(date);
            const dayOfWeek = isValidDate ? format(date, 'EEEE') : 'Unknown';
            const formattedDate = isValidDate ? format(date, 'MMM d, yyyy') : day.date;
            
            // Check if any exercise has perSide enabled
            const hasPerSideExercises = day.exercises.some(ex => ex.perSide);
            
            // Get exercises with notes
            const exercisesWithNotes = day.exercises.filter(ex => ex.notes);
            
            return (
              <TableRow key={day.id} className="hover:bg-gray-50">
                <TableCell>{formattedDate}</TableCell>
                <TableCell>{dayOfWeek}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getIntensityColor(day.intensity)}>
                    {day.intensity}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{day.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{day.exercises.length}</span>
                    <div className="flex gap-1 mt-1">
                      {hasPerSideExercises && (
                        <Badge className="text-xs px-1.5 py-0 h-5 bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Per Side
                        </Badge>
                      )}
                      {day.exercises.some(ex => !ex.isReps) && (
                        <Badge className="text-xs px-1.5 py-0 h-5 bg-purple-100 text-purple-800 hover:bg-purple-100">
                          Distance
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {exercisesWithNotes.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {exercisesWithNotes.slice(0, 2).map((exercise, index) => (
                        <div 
                          key={index} 
                          className="flex items-center cursor-pointer text-xs hover:underline"
                          onClick={() => showFullNotes(day.name, exercise.name, exercise.notes)}
                        >
                          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1.5"></span>
                          <span className="text-xs truncate max-w-[120px]" title="Click to view full notes">
                            {exercise.name || `Exercise ${index + 1}`}
                          </span>
                        </div>
                      ))}
                      {exercisesWithNotes.length > 2 && (
                        <span className="text-xs text-muted-foreground ml-3 pl-[6px]">
                          +{exercisesWithNotes.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
          
          {sortedDays.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No training days added yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Notes dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        {selectedNote && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Notes for {selectedNote.exerciseName || 'Exercise'}
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  {selectedNote.dayName}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
              {selectedNote.notes}
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setSelectedNote(null)}>Close</Button>
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

export default TableView; 