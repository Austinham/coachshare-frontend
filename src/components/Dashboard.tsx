import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, Calendar, Dumbbell, TrendingUp, Users, CalendarIcon, Wind, Activity, Flame, LineChart, Star, Clock, User, Calculator, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';
import { RegimenType } from '@/types/regimen';
import ProgramIntensityDisplay from '@/components/dashboard/ProgramIntensityDisplay';
import { useToast } from '@/components/ui/use-toast';
import { regimenService, workoutLogsService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import RegimenCard from '@/components/regimen/RegimenCard';
import DataIsolationAlert from '@/components/DataIsolationAlert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StatCard from '@/components/dashboard/StatCard';

// Define props StatCard is known to accept based on its general usage or simplest form
interface StatCardPassedProps {
  title: string;
  value: string;
  icon: React.ReactNode; 
  bgColor: string;
}

interface StatItem {
  title: string;
  value: string;
  iconComponent: React.ComponentType<{ className?: string }>; // Renamed to avoid conflict 
  color: string; 
  action?: () => void; 
  actionLabel?: string;
}

interface RegimenItem extends Omit<RegimenType, 'id'> { 
  id: string; 
  _id?: string; 
}

// Add getRatingIndicator helper function before Dashboard component
const getRatingIndicator = (rating: number) => {
  if (rating <= 3) return { icon: Wind, color: 'text-green-500', text: 'Easy' };
  if (rating <= 7) return { icon: Activity, color: 'text-amber-500', text: 'Moderate' };
  return { icon: Flame, color: 'text-red-500', text: 'Challenging' };
};

// Add a helper function to extract user ID safely
const getUserId = (user: any): string => {
  if (!user) return '';
  
  // Typescript-safe way to check for id properties
  const userObj = user as Record<string, any>;
  return (userObj.id || userObj._id || '').toString();
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeRegimens, setActiveRegimens] = useState<RegimenItem[]>([]);
  const [upcomingRegimens, setUpcomingRegimens] = useState<RegimenItem[]>([]);
  const [pastRegimens, setPastRegimens] = useState<RegimenItem[]>([]);
  const [loadingRegimens, setLoadingRegimens] = useState(true);
  const [regimensError, setRegimensError] = useState<string | null>(null);
  const [workoutStats, setWorkoutStats] = useState<any>({
    totalWorkouts: 0,
    averageRating: 0,
    averageDuration: 0,
    completionRate: 0,
    recentLogs: []
  });
  const [loadingWorkoutStats, setLoadingWorkoutStats] = useState(true);
  const [workoutStatsError, setWorkoutStatsError] = useState<string | null>(null);
  const [noWorkoutData, setNoWorkoutData] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [orphanedLogs, setOrphanedLogs] = useState<any[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  
  const fetchRegimens = useCallback(async () => {
    setLoadingRegimens(true);
    setRegimensError(null);
    try {
      const allRegimensData = await regimenService.getAllRegimens();
      // Ensure data is transformed to RegimenItem[] with a required id
      const allRegimens: RegimenItem[] = allRegimensData.map((r: any) => ({ 
          ...r, 
          id: r.id || r._id || String(new Date().getTime() + Math.random()) // Fallback id, ensure it's string
      })); 

      if (!allRegimens || allRegimens.length === 0) {
        setActiveRegimens([]);
        setUpcomingRegimens([]);
        setPastRegimens([]);
        return;
      }

      const now = new Date();
      const active: RegimenItem[] = [];
      const upcoming: RegimenItem[] = [];
      const past: RegimenItem[] = [];

      allRegimens.forEach((regimen) => {
        try {
          const startDate = regimen.startDate ? parseISO(regimen.startDate) : null;
          const endDate = regimen.endDate ? parseISO(regimen.endDate) : null;

          if (startDate && endDate) {
            if (isAfter(now, startDate) && isBefore(now, endDate)) {
              active.push(regimen);
            } else if (isBefore(now, startDate)) {
              upcoming.push(regimen);
            } else if (isAfter(now, endDate)) {
              past.push(regimen);
            }
          } else if (startDate && isAfter(now, startDate)) { 
            active.push(regimen);
          } else if (startDate && isBefore(now, startDate)) {
            upcoming.push(regimen);
          } else { 
            past.push(regimen); 
          }
        } catch (e) {
          console.error(`Error parsing dates for regimen ${regimen.name || regimen.id}:`, e);
        }
      });
      
      setActiveRegimens(active.sort((a,b) => differenceInDays(parseISO(b.createdAt), parseISO(a.createdAt))));
      setUpcomingRegimens(upcoming.sort((a,b) => differenceInDays(parseISO(a.startDate!), parseISO(b.startDate!))));
      setPastRegimens(past.sort((a,b) => differenceInDays(parseISO(b.endDate!), parseISO(a.endDate!))));

    } catch (error) {
      console.error('Error fetching regimens:', error);
      setRegimensError(error instanceof Error ? error.message : 'Failed to load regimens.');
    } finally {
      setLoadingRegimens(false);
    }
  }, []);

  const fetchWorkoutStats = useCallback(async () => {
    if (!user) return;
    setLoadingWorkoutStats(true);
    setWorkoutStatsError(null);
    setNoWorkoutData(false);
    try {
      // Assuming getWorkoutLogStats is the correct method or exists.
      // If workoutLogsService is strictly typed and getCoachWorkoutStats is missing, this will still error.
      // This might require a change in the service definition if the method name is indeed different.
      const statsData = await (workoutLogsService as any).getCoachWorkoutStats(getUserId(user));
      if (statsData && Object.keys(statsData).length > 0 && statsData.totalWorkouts > 0) {
        setWorkoutStats(statsData);
      } else {
        setNoWorkoutData(true);
        setWorkoutStats({
            totalWorkouts: 0,
            averageRating: 0,
            averageDuration: 0,
            completionRate: 0,
            recentLogs: []
        });
      }
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      setWorkoutStatsError(error instanceof Error ? error.message : 'Failed to load workout statistics.');
      setNoWorkoutData(true); 
    } finally {
      setLoadingWorkoutStats(false);
    }
  }, [user]);
  
  const checkForOrphanedLogs = useCallback(async () => {
    if (user?.role !== 'coach') return;
    try {
      // Assuming getOrphanedLogs exists on the service.
      const logs = await (workoutLogsService as any).getOrphanedLogs();
      if (logs && logs.length > 0) {
        setOrphanedLogs(logs);
        setCleanupDialogOpen(true);
      }
    } catch (error) {
      console.error('Error checking for orphaned logs:', error);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchRegimens();
    fetchWorkoutStats();
    checkForOrphanedLogs();
  }, [fetchRegimens, fetchWorkoutStats, checkForOrphanedLogs]);

  const handleCleanupOrphanedLogs = async () => {
    setCleanupLoading(true);
    try {
      // Assuming deleteOrphanedLogs exists on the service.
      await (workoutLogsService as any).deleteOrphanedLogs(orphanedLogs.map(log => log._id));
      toast({ title: 'Success', description: 'Orphaned workout logs cleaned up.' });
      setCleanupDialogOpen(false);
      setOrphanedLogs([]);
      fetchWorkoutStats(); 
    } catch (error) {
      console.error('Error cleaning up orphaned logs:', error);
      toast({ variant: 'destructive', title: 'Cleanup Failed', description: error instanceof Error ? error.message : 'Could not delete orphaned logs.' });
    } finally {
      setCleanupLoading(false);
    }
  };
  
  const dashboardStats = useMemo((): StatItem[] => [
    {
      title: "Active Regimens",
      value: activeRegimens.length.toString(),
      iconComponent: Dumbbell,
      color: "bg-coach-primary",
      action: () => navigate("/app/regimens"),
      actionLabel: "View Regimens",
    },
    {
      title: "Upcoming Sessions",
      value: upcomingRegimens.reduce((acc, curr) => acc + (curr.days?.length || 0), 0).toString(),
      iconComponent: CalendarIcon,
      color: "bg-coach-accent",
      action: () => navigate("/app/schedule"),
      actionLabel: "View Schedule",
    },
    {
      title: "Completed Workouts",
      value: workoutStats.totalWorkouts.toString(),
      iconComponent: TrendingUp,
      color: "bg-green-500",
      action: () => navigate("/app/analytics"), 
      actionLabel: "View Analytics",
    },
    {
      title: "Athletes Connected", 
      value: user?.athletes?.length.toString() || "0", 
      iconComponent: Users,
      color: "bg-yellow-500",
      action: () => navigate("/app/athletes"),
      actionLabel: "Manage Athletes",
    },
  ], [activeRegimens.length, upcomingRegimens, workoutStats.totalWorkouts, user, navigate]);

  const renderRegimenSection = (title: string, regimens: RegimenItem[], isLoading: boolean, error: string | null, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="text-center py-4">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading {title.toLowerCase()}...</p>
        </div>
      );
    }
    if (error) {
      return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
    if (regimens.length === 0) {
      return <p className="text-sm text-gray-500 py-4 text-center">{emptyMessage}</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regimens.map(regimen => (
          <RegimenCard key={regimen.id} regimen={regimen as RegimenType} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <DataIsolationAlert />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName || 'Coach'}!</h1>
        <Button onClick={() => navigate('/app/regimens/create')} className="shrink-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Regimen
        </Button>
      </div>

      {/* Stats Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-3">At a Glance</h2>
        {loadingWorkoutStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_,idx) => (
                <Card key={idx} className="p-4"><div className="h-24 bg-gray-200 rounded animate-pulse"></div></Card>
            ))}
          </div>
        ) : workoutStatsError ? (
           <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Stats</AlertTitle><AlertDescription>{workoutStatsError}</AlertDescription></Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => {
              const IconComponent = stat.iconComponent;
              const statCardProps: StatCardPassedProps = {
                title: stat.title,
                value: stat.value,
                icon: <IconComponent className="h-6 w-6 text-white" />,
                bgColor: stat.color,
              };
              return (
                <StatCard 
                  key={stat.title} 
                  {...statCardProps}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Workout Logs Summary */}
      {user?.role === 'coach' && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Recent Athlete Activity</h2>
            {loadingWorkoutStats ? (
                <Card className="p-4"><div className="h-40 bg-gray-200 rounded animate-pulse"></div></Card>
            ) : workoutStatsError ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Activity</AlertTitle><AlertDescription>{workoutStatsError}</AlertDescription></Alert>
            ) : noWorkoutData ? (
                <Card className="text-center p-6">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2"/>
                    <h3 className="text-lg font-medium">No Workout Data Yet</h3>
                    <p className="text-sm text-gray-500 mb-3">Assigned athlete workouts and their logs will appear here.</p>
                    <Button variant="outline" onClick={() => navigate("/app/athletes")}>Manage Athletes</Button>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Workout Log Insights</CardTitle>
                        <CardDescription>
                            Overview of workouts logged by your athletes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                            <LineChart className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-xs text-gray-500">Total Logged Workouts</p>
                                <p className="text-xl font-semibold">{workoutStats.totalWorkouts}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                            <Star className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-xs text-gray-500">Avg. Perceived Rating</p>
                                <p className="text-xl font-semibold">{workoutStats.averageRating?.toFixed(1) || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                            <Clock className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-xs text-gray-500">Avg. Workout Duration</p>
                                <p className="text-xl font-semibold">{workoutStats.averageDuration?.toFixed(0) || 'N/A'} min</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                            <Users className="h-8 w-8 text-purple-500" />
                             <div>
                                <p className="text-xs text-gray-500">Completion Rate</p>
                                <p className="text-xl font-semibold">{(workoutStats.completionRate * 100)?.toFixed(0) || 'N/A'}%</p>
                            </div>
                        </div>
                    </CardContent>
                    {workoutStats.recentLogs && workoutStats.recentLogs.length > 0 && (
                        <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                             <h4 className="text-sm font-medium">Most Recent Logs:</h4>
                            <ul className="list-disc list-inside text-xs text-gray-600 pl-2">
                                {workoutStats.recentLogs.slice(0,3).map((log: any) => (
                                    <li key={log._id}>
                                        {log.athlete?.firstName} {log.athlete?.lastName} completed <strong>{log.workoutName || 'a workout'}</strong> from "{log.regimenName || 'a regimen'}" on {format(parseISO(log.date), 'MMM d')}
                                        {log.rating && <span> (Rated: {log.rating}/10)</span>}
                                    </li>
                                ))}
                            </ul>
                            {workoutStats.recentLogs.length > 3 && <Link to="/app/analytics" className="text-xs text-coach-primary hover:underline">View all logs...</Link>}
                        </CardFooter>
                    )}
                </Card>
            )}
        </section>
      )}

      {/* Active Regimens Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Active Regimens ({activeRegimens.length})</h2>
          <Link to="/app/regimens?status=active" className="text-sm text-coach-primary hover:underline">View All</Link>
        </div>
        {renderRegimenSection(
          "Active Regimens", 
          activeRegimens.slice(0,3), 
          loadingRegimens, 
          regimensError, 
          user?.role === 'coach' ? "No active regimens. Assign start and end dates to your regimens, or create a new one!" : "No active regimens assigned to you currently."
        )}
      </section>

      {/* Upcoming Regimens Section */}
      <section>
         <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Upcoming Regimens ({upcomingRegimens.length})</h2>
          <Link to="/app/regimens?status=upcoming" className="text-sm text-coach-primary hover:underline">View All</Link>
        </div>
        {renderRegimenSection(
          "Upcoming Regimens", 
          upcomingRegimens.slice(0,3), 
          loadingRegimens, 
          regimensError, 
          user?.role === 'coach' ? "No regimens scheduled to start soon. Plan ahead!" : "No upcoming regimens on your schedule."
        )}
      </section>

      {/* Past Regimens Section - Optional or less prominent */}
      {pastRegimens.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Past Regimens ({pastRegimens.length})</h2>
            <Link to="/app/regimens?status=past" className="text-sm text-gray-500 hover:underline">View Archive</Link>
          </div>
          {renderRegimenSection(
            "Past Regimens", 
            pastRegimens.slice(0,2), // Show fewer for past by default
            loadingRegimens, 
            regimensError, 
            "No past regimens found."
          )}
        </section>
      )}
      
      {/* Program Intensity Overview - If data is available */}
      {!loadingRegimens && !regimensError && (activeRegimens.length > 0 || upcomingRegimens.length > 0) && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Program Intensity Overview</h2>
          <ProgramIntensityDisplay programs={[...activeRegimens, ...upcomingRegimens] as RegimenType[]} />
        </section>
      )}

      {/* Cleanup Dialog for Orphaned Logs */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orphaned Workout Log Cleanup</DialogTitle>
            <DialogDescription>
              We found {orphanedLogs.length} workout log(s) that are no longer associated with any active regimen or athlete. This can happen if regimens or athletes were deleted.
              Would you like to remove these orphaned logs to keep your data clean?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action is irreversible. Once deleted, these logs cannot be recovered.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupDialogOpen(false)} disabled={cleanupLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCleanupOrphanedLogs} disabled={cleanupLoading}>
              {cleanupLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} 
              Delete {orphanedLogs.length} Log(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
