import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { IntensityLevel } from '@/types/regimen';

interface WeekDifficultyPickerProps {
  intensities: Record<string, IntensityLevel>;
  onIntensityChange: (day: string, intensity: IntensityLevel) => void;
  customIntensities?: string[];
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DEFAULT_INTENSITIES: IntensityLevel[] = ['Easy', 'Medium', 'Hard', 'Rest'];

const WeekDifficultyPicker: React.FC<WeekDifficultyPickerProps> = ({
  intensities,
  onIntensityChange,
  customIntensities = []
}) => {
  // Combine default and custom intensities
  const allIntensities = [...DEFAULT_INTENSITIES, ...customIntensities];

  // Function to handle clearing/resetting an intensity for a day
  const handleClearIntensity = (day: string) => {
    // Remove the intensity for this day
    onIntensityChange(day, '' as IntensityLevel);
  };

  // Function to handle clicking an intensity button
  const handleIntensityClick = (day: string, intensity: IntensityLevel) => {
    // If this intensity is already selected, clear it
    if (intensities[day] === intensity) {
      handleClearIntensity(day);
    } else {
      // Otherwise, select it
      onIntensityChange(day, intensity);
    }
  };

  // Get button color class based on intensity
  const getButtonColorClass = (intensity: IntensityLevel, isSelected: boolean) => {
    if (!isSelected) return "bg-gray-50 hover:bg-gray-100 text-gray-700";
    
    switch (intensity) {
      case 'Easy':
        return "bg-green-100 hover:bg-green-200 text-green-800 border-green-400 shadow-sm shadow-green-100";
      case 'Medium':
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-400 shadow-sm shadow-yellow-100";
      case 'Hard':
        return "bg-red-100 hover:bg-red-200 text-red-800 border-red-400 shadow-sm shadow-red-100";
      case 'Rest':
        return "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400 shadow-sm shadow-blue-100";
      default:
        return "bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-400 shadow-sm shadow-purple-100";
    }
  };

  return (
    <Card className="mb-6 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-xl">Weekly Training Schedule</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day) => (
            <div 
              key={day} 
              className="border-b pb-4 last:border-b-0 opacity-95 transform transition-all duration-200 hover:opacity-100 animate-fadeIn"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-lg">{day}</h3>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className="font-semibold">{intensities[day] || 'Not set'}</span>
                  </div>
                  {intensities[day] && (
                    <div className="transition-transform duration-150 hover:scale-110 active:scale-90">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 rounded-full hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                        onClick={() => handleClearIntensity(day)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Clear selection</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allIntensities.map((intensity) => {
                  const isSelected = intensities[day] === intensity;
                  return (
                    <div
                      key={`${day}-${intensity}`}
                      className="transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${getButtonColorClass(intensity, isSelected)} 
                                  ${isSelected ? 'border-2 font-medium' : 'border'} 
                                  transition-all duration-200 w-full`}
                        onClick={() => handleIntensityClick(day, intensity)}
                      >
                        {intensity}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekDifficultyPicker; 