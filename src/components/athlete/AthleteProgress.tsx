import React from 'react';
import { TrendingUp, Dumbbell, Target, Clock, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Define interfaces for metrics
interface BaseMetric {
  id: string;
  current: number;
  previous: number;
  unit: string;
  goal: number;
  improvement: boolean;
}

interface ExerciseMetric extends BaseMetric {
  exercise: string;
  metric: string;
}

interface BodyMetric extends BaseMetric {
  metric: string;
}

// Mock data for progress metrics
const strengthMetrics: ExerciseMetric[] = [
  { id: '1', exercise: 'Bench Press', metric: 'Weight', current: 165, previous: 155, unit: 'lbs', goal: 185, improvement: true },
  { id: '2', exercise: 'Squats', metric: 'Weight', current: 225, previous: 205, unit: 'lbs', goal: 250, improvement: true },
  { id: '3', exercise: 'Pull-ups', metric: 'Reps', current: 8, previous: 6, unit: 'reps', goal: 12, improvement: true },
  { id: '4', exercise: 'Deadlift', metric: 'Weight', current: 265, previous: 245, unit: 'lbs', goal: 300, improvement: true },
  { id: '5', exercise: 'Shoulder Press', metric: 'Weight', current: 95, previous: 90, unit: 'lbs', goal: 115, improvement: true }
];

const enduranceMetrics: ExerciseMetric[] = [
  { id: '1', exercise: '5K Run', metric: 'Time', current: 28.5, previous: 31.2, unit: 'min', goal: 25, improvement: true },
  { id: '2', exercise: 'Cycling', metric: 'Distance', current: 15.2, previous: 12.5, unit: 'miles', goal: 20, improvement: true },
  { id: '3', exercise: 'Rowing', metric: 'Time', current: 8.3, previous: 9.1, unit: 'min/1K', goal: 7.5, improvement: true }
];

const bodyMetrics: BodyMetric[] = [
  { id: '1', metric: 'Weight', current: 175, previous: 182, unit: 'lbs', goal: 170, improvement: true },
  { id: '2', metric: 'Body Fat', current: 18, previous: 21, unit: '%', goal: 15, improvement: true },
  { id: '3', metric: 'Chest', current: 42, previous: 41, unit: 'inches', goal: 44, improvement: true },
  { id: '4', metric: 'Waist', current: 34, previous: 36, unit: 'inches', goal: 32, improvement: true },
  { id: '5', metric: 'Arms', current: 15, previous: 14.5, unit: 'inches', goal: 16, improvement: true }
];

const AthleteProgress: React.FC = () => {
  // Calculate overall progress
  const calculateProgress = (metrics: BaseMetric[]) => {
    const totalMetrics = metrics.length;
    const improvingMetrics = metrics.filter(m => m.improvement).length;
    return Math.round((improvingMetrics / totalMetrics) * 100);
  };
  
  const strengthProgress = calculateProgress(strengthMetrics);
  const enduranceProgress = calculateProgress(enduranceMetrics);
  const bodyProgress = calculateProgress(bodyMetrics);
  
  // Calculate goal completion
  const calculateGoalCompletion = (metric: BaseMetric) => {
    if (metric.goal > metric.current) {
      // For metrics where higher is better (weight lifted, distance, etc.)
      return Math.min(Math.round((metric.current / metric.goal) * 100), 100);
    } else {
      // For metrics where lower is better (time, body fat, etc.)
      return Math.min(Math.round((metric.goal / metric.current) * 100), 100);
    }
  };
  
  return (
    <div className="container max-w-7xl mx-auto py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Progress</h1>
      
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-coach-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Strength Progress</p>
                <h3 className="text-2xl font-bold">{strengthProgress}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-primary/20 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-coach-primary" />
              </div>
            </div>
            <Progress value={strengthProgress} className="h-2 bg-coach-primary/20" />
          </CardContent>
        </Card>
        
        <Card className="border-coach-secondary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Endurance Progress</p>
                <h3 className="text-2xl font-bold">{enduranceProgress}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-secondary/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-coach-secondary" />
              </div>
            </div>
            <Progress value={enduranceProgress} className="h-2 bg-coach-secondary/20" />
          </CardContent>
        </Card>
        
        <Card className="border-coach-accent/20 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Body Composition</p>
                <h3 className="text-2xl font-bold">{bodyProgress}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-coach-accent/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-coach-accent" />
              </div>
            </div>
            <Progress value={bodyProgress} className="h-2 bg-coach-accent/20" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="strength" className="mb-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="strength" className="data-[state=active]:bg-coach-primary data-[state=active]:text-white">Strength</TabsTrigger>
          <TabsTrigger value="endurance" className="data-[state=active]:bg-coach-secondary data-[state=active]:text-white">Endurance</TabsTrigger>
          <TabsTrigger value="body" className="data-[state=active]:bg-coach-accent data-[state=active]:text-white">Body Composition</TabsTrigger>
        </TabsList>
        
        {/* Strength Tab */}
        <TabsContent value="strength">
          <Card className="border-coach-primary/20">
            <CardHeader className="bg-coach-primary/5">
              <CardTitle>Strength Metrics</CardTitle>
              <CardDescription>Track your strength improvements over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {strengthMetrics.map(metric => (
                  <div key={metric.id} className="border border-coach-primary/20 rounded-lg p-4 hover:bg-coach-primary/5 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{metric.exercise}</h3>
                      <div className="text-sm font-medium flex items-center">
                        {metric.current} {metric.unit}
                        {metric.improvement && (
                          <span className="ml-2 text-coach-primary flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {((metric.current - metric.previous) / metric.previous * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>Previous: {metric.previous} {metric.unit}</span>
                      <ArrowRight className="mx-2 h-3 w-3" />
                      <span>Goal: {metric.goal} {metric.unit}</span>
                    </div>
                    <Progress 
                      value={calculateGoalCompletion(metric)} 
                      className="h-2 bg-coach-primary/20" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Endurance Tab */}
        <TabsContent value="endurance">
          <Card className="border-coach-secondary/20">
            <CardHeader className="bg-coach-secondary/5">
              <CardTitle>Endurance Metrics</CardTitle>
              <CardDescription>Track your cardiovascular and endurance progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {enduranceMetrics.map(metric => (
                  <div key={metric.id} className="border border-coach-secondary/20 rounded-lg p-4 hover:bg-coach-secondary/5 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{metric.exercise}</h3>
                      <div className="text-sm font-medium flex items-center">
                        {metric.current} {metric.unit}
                        {metric.improvement && (
                          <span className="ml-2 text-coach-secondary flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {metric.exercise.includes('Time') 
                              ? ((metric.previous - metric.current) / metric.previous * 100).toFixed(1)
                              : ((metric.current - metric.previous) / metric.previous * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>Previous: {metric.previous} {metric.unit}</span>
                      <ArrowRight className="mx-2 h-3 w-3" />
                      <span>Goal: {metric.goal} {metric.unit}</span>
                    </div>
                    <Progress 
                      value={calculateGoalCompletion(metric)} 
                      className="h-2 bg-coach-secondary/20" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Body Composition Tab */}
        <TabsContent value="body">
          <Card className="border-coach-accent/20">
            <CardHeader className="bg-coach-accent/5">
              <CardTitle>Body Composition</CardTitle>
              <CardDescription>Track changes in your body measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {bodyMetrics.map(metric => (
                  <div key={metric.id} className="border border-coach-accent/20 rounded-lg p-4 hover:bg-coach-accent/5 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{metric.metric}</h3>
                      <div className="text-sm font-medium flex items-center">
                        {metric.current} {metric.unit}
                        {metric.improvement && (
                          <span className="ml-2 text-coach-accent flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {metric.metric === 'Body Fat' || metric.metric === 'Waist'
                              ? ((metric.previous - metric.current) / metric.previous * 100).toFixed(1)
                              : ((metric.current - metric.previous) / metric.previous * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>Previous: {metric.previous} {metric.unit}</span>
                      <ArrowRight className="mx-2 h-3 w-3" />
                      <span>Goal: {metric.goal} {metric.unit}</span>
                    </div>
                    <Progress 
                      value={calculateGoalCompletion(metric)} 
                      className="h-2 bg-coach-accent/20" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-8">
        <Button variant="outline" className="mr-2">Export Progress</Button>
        <Button className="bg-coach-primary hover:bg-coach-primary/90">Schedule Assessment</Button>
      </div>
    </div>
  );
};

export default AthleteProgress; 