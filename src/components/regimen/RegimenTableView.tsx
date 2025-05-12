
import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { TrainingDayType } from '@/types/regimen';
import { ChevronDown, ChevronRight, Video, Image, Link2 } from 'lucide-react';

interface RegimenTableViewProps {
  days: TrainingDayType[];
}

const RegimenTableView: React.FC<RegimenTableViewProps> = ({ days }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    days.reduce((acc, day) => ({ ...acc, [day.id]: true }), {})
  );

  const toggleSection = (dayId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => (
        <Collapsible 
          key={day.id} 
          open={openSections[day.id]} 
          onOpenChange={() => toggleSection(day.id)}
          className="border rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-none"
            >
              <div className="flex items-center">
                {openSections[day.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="ml-2 font-medium">
                  Day {dayIndex + 1}: {day.name} ({new Date(day.date).toLocaleDateString()})
                </span>
              </div>
              <span className="text-sm text-gray-500">{day.exercises.length} exercises</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Exercise</TableHead>
                    <TableHead className="w-[80px] text-center">Sets</TableHead>
                    <TableHead className="w-[120px] text-center">Reps/Duration</TableHead>
                    <TableHead className="w-[120px] text-center">Rest</TableHead>
                    <TableHead className="w-[100px] text-center">Media</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell className="text-center">{exercise.sets}</TableCell>
                      <TableCell className="text-center">
                        {exercise.isReps 
                          ? `${exercise.reps} reps` 
                          : exercise.duration}
                      </TableCell>
                      <TableCell className="text-center">{exercise.restInterval || '—'}</TableCell>
                      <TableCell className="text-center">
                        {exercise.mediaLinks.length > 0 ? (
                          <div className="flex justify-center gap-1">
                            {exercise.mediaLinks.map((link, i) => (
                              <a 
                                key={i} 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {link.includes('video') ? <Video size={16} /> : <Image size={16} />}
                              </a>
                            ))}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">
                        {exercise.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default RegimenTableView;
