
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingDayType } from '@/types/regimen';
import { CalendarIcon, Clock } from 'lucide-react';

interface RegimenListViewProps {
  days: TrainingDayType[];
}

const RegimenListView: React.FC<RegimenListViewProps> = ({ days }) => {
  return (
    <div className="space-y-6">
      {days.map((day, dayIndex) => (
        <Card key={day.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Day {dayIndex + 1}: {day.name}</CardTitle>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon size={14} className="mr-1" />
                {new Date(day.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <ul className="divide-y divide-gray-100">
              {day.exercises.map((exercise, exerciseIndex) => (
                <li key={exercise.id} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-base">{exercise.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>Rest: {exercise.restInterval || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <span className="mr-6">{exercise.sets} sets</span>
                    <span>
                      {exercise.isReps 
                        ? `${exercise.reps} reps` 
                        : `Duration: ${exercise.duration}`}
                    </span>
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
                            key={i} 
                            href={link} 
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RegimenListView;
