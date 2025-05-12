import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { RegimenType } from '@/types/regimen';
import { Activity, Calendar, TrendingUp, ChevronDown, X, Gauge, BarChart, CircleDashed, PieChart as PieChartIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProgramIntensityDisplayProps {
  programs: RegimenType[];
  selectedProgramId?: string | null;
  onProgramDeselect?: () => void;
}

interface IntensityStats {
  totalDays: number;
  intensityCounts: Record<string, number>;
  mostCommonIntensity: string;
  hasRestDays: boolean;
  restDayCount: number;
  hardDayCount: number;
  mediumDayCount: number;
  easyDayCount: number;
}

// Custom styled progress components for different intensities
const RedProgress = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Progress>>(
  (props, ref) => (
    <Progress
      ref={ref}
      {...props}
      className={`h-2 ${props.className}`}
      style={{ 
        ...props.style,
        '--progress-background': 'rgb(254, 226, 226)',
        '--progress-foreground': 'rgb(239, 68, 68)'
      } as React.CSSProperties}
    />
  )
);

const YellowProgress = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Progress>>(
  (props, ref) => (
    <Progress
      ref={ref}
      {...props}
      className={`h-2 ${props.className}`}
      style={{ 
        ...props.style,
        '--progress-background': 'rgb(254, 249, 195)',
        '--progress-foreground': 'rgb(234, 179, 8)'
      } as React.CSSProperties}
    />
  )
);

const GreenProgress = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Progress>>(
  (props, ref) => (
    <Progress
      ref={ref}
      {...props}
      className={`h-2 ${props.className}`}
      style={{ 
        ...props.style,
        '--progress-background': 'rgb(220, 252, 231)',
        '--progress-foreground': 'rgb(34, 197, 94)'
      } as React.CSSProperties}
    />
  )
);

const BlueProgress = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Progress>>(
  (props, ref) => (
    <Progress
      ref={ref}
      {...props}
      className={`h-2 ${props.className}`}
      style={{ 
        ...props.style,
        '--progress-background': 'rgb(219, 234, 254)',
        '--progress-foreground': 'rgb(59, 130, 246)'
      } as React.CSSProperties}
    />
  )
);

const ProgramIntensityDisplay: React.FC<ProgramIntensityDisplayProps> = ({ programs, selectedProgramId, onProgramDeselect }) => {
  const [selectedProgramIdState, setSelectedProgramId] = useState<string>(selectedProgramId || '');
  
  // Update internal state when prop changes
  useEffect(() => {
    if (selectedProgramId) {
      setSelectedProgramId(selectedProgramId);
    }
  }, [selectedProgramId]);
  
  // Get the selected program
  const selectedProgram = programs.find(program => program.id === selectedProgramIdState);
  
  // Calculate intensity statistics
  const calculateIntensityStats = (days: any[]): IntensityStats => {
    const totalDays = days.length;
    const intensityCounts = days.reduce((acc, day) => {
      acc[day.intensity] = (acc[day.intensity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort intensities by count and get the most common one
    const sortedIntensities = Object.entries(intensityCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number));
    const mostCommonIntensity = sortedIntensities[0]?.[0] || 'Unknown';

    return {
      totalDays,
      intensityCounts,
      mostCommonIntensity,
      hasRestDays: intensityCounts['Rest'] > 0,
      restDayCount: intensityCounts['Rest'] || 0,
      hardDayCount: intensityCounts['Hard'] || 0,
      mediumDayCount: intensityCounts['Medium'] || 0,
      easyDayCount: intensityCounts['Easy'] || 0
    };
  };

  // Get intensity color
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Rest':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        // This is a custom intensity
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  if (!selectedProgram) {
    return (
      <Card className="bg-white shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Program Intensity Overview</h3>
              <div className="flex items-center gap-2">
                <Select value={selectedProgramIdState} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setSelectedProgramId('');
                    if (onProgramDeselect) {
                      onProgramDeselect();
                    }
                  }}
                  title="Clear selection"
                  aria-label="Clear program selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center text-gray-500">
              <Activity className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p>Select a program to view its intensity details</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const intensityStats = calculateIntensityStats(selectedProgram.days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Program Intensity Overview</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedProgramIdState} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              setSelectedProgramId('');
              if (onProgramDeselect) {
                onProgramDeselect();
              }
            }}
            title="Clear selection"
            aria-label="Clear program selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Overview Card */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-coach-primary" />
              Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500">Total Days</div>
                  <div className="text-xl font-semibold">{intensityStats.totalDays}</div>
                </div>
                <div className="p-3 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500">Most Common</div>
                  <div className="text-xl font-semibold flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${getIntensityColor(intensityStats.mostCommonIntensity).split(' ')[0]}`}></span>
                    {intensityStats.mostCommonIntensity}
                  </div>
                </div>
              </div>
              
              {/* Intensity breakdown with progress bars */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">Hard</span>
                    <span className="text-xs font-semibold text-red-600">{intensityStats.hardDayCount}/{intensityStats.totalDays}</span>
                  </div>
                  <RedProgress value={(intensityStats.hardDayCount / intensityStats.totalDays) * 100} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">Medium</span>
                    <span className="text-xs font-semibold text-yellow-600">{intensityStats.mediumDayCount}/{intensityStats.totalDays}</span>
                  </div>
                  <YellowProgress value={(intensityStats.mediumDayCount / intensityStats.totalDays) * 100} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">Easy</span>
                    <span className="text-xs font-semibold text-green-600">{intensityStats.easyDayCount}/{intensityStats.totalDays}</span>
                  </div>
                  <GreenProgress value={(intensityStats.easyDayCount / intensityStats.totalDays) * 100} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">Rest</span>
                    <span className="text-xs font-semibold text-blue-600">{intensityStats.restDayCount}/{intensityStats.totalDays}</span>
                  </div>
                  <BlueProgress value={(intensityStats.restDayCount / intensityStats.totalDays) * 100} />
                </div>
              </div>
              
              {/* Add custom intensities section if they exist */}
              {selectedProgram.customIntensities && selectedProgram.customIntensities.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CircleDashed className="h-4 w-4 text-purple-500" />
                    <span>Custom Intensities</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProgram.customIntensities.map(intensity => (
                      <Badge 
                        key={intensity} 
                        variant="outline" 
                        className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1 rounded-full shadow-sm hover:shadow transition-shadow"
                      >
                        {intensity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intensity Distribution Card */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-coach-primary" />
              Intensity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-4">
              {/* Pie Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(intensityStats.intensityCounts).map(([intensity, count]) => ({
                        name: intensity,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(intensityStats.intensityCounts).map(([intensity, _]) => {
                        const color = getIntensityColor(intensity).split(' ')[0].replace('bg-', '');
                        const colorMap: Record<string, string> = {
                          'red-100': '#FEE2E2',
                          'yellow-100': '#FEF9C3',
                          'green-100': '#DCFCE7',
                          'blue-100': '#DBEAFE',
                          'purple-100': '#F3E8FF',
                          'gray-100': '#F3F4F6'
                        };
                        return (
                          <Cell 
                            key={`cell-${intensity}`} 
                            fill={colorMap[color] || '#F3F4F6'} 
                            stroke={colorMap[color]?.replace('100', '500') || '#9CA3AF'}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} days`, name]}
                      contentStyle={{ borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Bar list */}
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(intensityStats.intensityCounts).map(([intensity, count]) => {
                  const percentage = Math.round((count / intensityStats.totalDays) * 100);
                  return (
                    <div key={intensity} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{intensity}</span>
                        <Badge 
                          variant="outline" 
                          className={`${getIntensityColor(intensity)} px-2 py-0.5 text-xs`}
                        >
                          {count} {count === 1 ? 'day' : 'days'} ({percentage}%)
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getIntensityColor(intensity).split(' ')[0]}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day-by-Day Breakdown Card */}
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow md:col-span-2">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-coach-primary" />
              Day-by-Day Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {selectedProgram.days.map((day) => (
                <div 
                  key={day.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getIntensityColor(day.intensity).split(' ')[0]}`} />
                    <div>
                      <span className="font-medium">{day.name}</span>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(day.date), 'EEE, MMM d')}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getIntensityColor(day.intensity)} px-3 py-1`}
                  >
                    {day.intensity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgramIntensityDisplay; 