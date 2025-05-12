
import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Activity 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const Analytics: React.FC = () => {
  // Mock data for charts
  const performanceData = [
    { month: 'Jan', athletes: 20, progress: 65 },
    { month: 'Feb', athletes: 22, progress: 70 },
    { month: 'Mar', athletes: 28, progress: 85 },
    { month: 'Apr', athletes: 32, progress: 73 },
    { month: 'May', athletes: 35, progress: 80 },
    { month: 'Jun', athletes: 34, progress: 90 }
  ];

  const completionRateData = [
    { name: 'Completed', value: 75 },
    { name: 'Missed', value: 25 }
  ];

  const COLORS = ['#4F46E5', '#E5E7EB'];

  const workoutTypeData = [
    { name: 'Strength', sessions: 45 },
    { name: 'Endurance', sessions: 30 },
    { name: 'Recovery', sessions: 15 },
    { name: 'Mobility', sessions: 25 },
    { name: 'Conditioning', sessions: 20 }
  ];

  const athleteAdherenceData = [
    { name: 'Team A', adherence: 92 },
    { name: 'Team B', adherence: 85 },
    { name: 'Team C', adherence: 78 },
    { name: 'Team D', adherence: 88 },
    { name: 'Team E', adherence: 95 }
  ];

  const overviewStats = [
    { title: 'Total Athletes', value: '35', icon: Users, color: 'bg-coach-primary' },
    { title: 'Avg. Completion', value: '75%', icon: Award, color: 'bg-coach-secondary' },
    { title: 'Training Growth', value: '+12%', icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Active Programs', value: '18', icon: Activity, color: 'bg-coach-accent' }
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Track athlete performance and training program effectiveness</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="completion">Completion Rates</TabsTrigger>
          <TabsTrigger value="workouts">Workout Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Athlete Performance Trends</CardTitle>
              <CardDescription>Athlete count and progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="athletes" 
                      stroke="#4F46E5" 
                      activeDot={{ r: 8 }} 
                      name="Active Athletes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#8B5CF6" 
                      name="Progress Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completion">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Completion Rate</CardTitle>
                <CardDescription>Percentage of completed vs. missed sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionRateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {completionRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Adherence</CardTitle>
                <CardDescription>Adherence rates by team or group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={athleteAdherenceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="adherence" fill="#4F46E5" name="Adherence %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="workouts">
          <Card>
            <CardHeader>
              <CardTitle>Workout Distribution</CardTitle>
              <CardDescription>Sessions by workout type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workoutTypeData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="#8B5CF6" name="Number of Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional insights section */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key takeaways from your training programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Positive Progress Trend</h3>
                <p className="text-gray-600">Athletes showed a 15% improvement in performance metrics over the last 8 weeks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Attendance Patterns</h3>
                <p className="text-gray-600">Highest attendance rates on Monday and Wednesday mornings; consider scheduling high-priority sessions during these times.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Team Comparison</h3>
                <p className="text-gray-600">Team E shows 95% adherence to training regimens - investigate their success factors for potential program improvements.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
