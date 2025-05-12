import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workoutLogsService } from '@/services/api'; // Import from api.ts
import { WorkoutLog } from '@/types/workoutLog'; // Import from the new type file
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import LogDetailModal from '@/components/coach/LogDetailModal';

const CoachSharedLogsViewer: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user || user.role !== 'coach') {
                setError("Access denied. Only coaches can view this page.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const fetchedLogs = await workoutLogsService.getCoachWorkoutLogs(); // Assuming this fetches shared logs for the coach
                // Ensure athlete details are included as expected from the backend
                const processedLogs = fetchedLogs.map(log => ({
                    ...log,
                    // Attempt to extract/construct name if not directly provided
                    athleteName: (log.athleteId && typeof log.athleteId === 'object' && 'firstName' in log.athleteId && 'lastName' in log.athleteId) 
                                 ? `${log.athleteId.firstName} ${log.athleteId.lastName}`.trim() 
                                 : log.athleteName || 'Unknown Athlete',
                    athleteProfilePic: (log.athleteId && typeof log.athleteId === 'object' && 'avatarUrl' in log.athleteId) 
                                        ? log.athleteId.avatarUrl 
                                        : log.athleteProfilePic // Use pre-processed pic if available
                }));
                setLogs(processedLogs);
            } catch (err: any) {
                console.error("Error fetching shared logs:", err);
                setError(err.response?.data?.message || err.message || "Failed to fetch shared workout logs.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const handleViewDetails = (log: WorkoutLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px] ml-auto" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Shared Workout Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                         <Alert variant="destructive" className="mb-4">
                             <ExclamationTriangleIcon className="h-4 w-4" />
                             <AlertTitle>Error</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                         </Alert>
                    )}

                    {loading ? (
                        renderSkeleton()
                    ) : logs.length === 0 && !error ? (
                        <p className="text-center text-gray-500">No workout logs have been shared with you yet.</p>
                    ) : (
                        <Table>
                            <TableCaption>A list of workout logs shared with you by athletes.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Athlete</TableHead>
                                    <TableHead>Regimen</TableHead>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Date Completed</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Difficulty</TableHead>
                                    <TableHead>Duration (min)</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log._id}>
                                        <TableCell className="font-medium">{log.athleteName || 'N/A'}</TableCell>
                                        <TableCell>{log.regimenName || 'N/A'}</TableCell>
                                        <TableCell>{log.dayName || 'N/A'}</TableCell>
                                        <TableCell>{log.completedAt ? format(new Date(log.completedAt), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell>
                                            {log.rating ? `${log.rating}/5` : 'N/A'}
                                        </TableCell>
                                         <TableCell>
                                            {log.difficulty ? <Badge variant="outline">{log.difficulty}</Badge> : 'N/A'}
                                        </TableCell>
                                        <TableCell>{log.duration ? log.duration.toFixed(0) : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {selectedLog && (
                <LogDetailModal
                    log={selectedLog}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default CoachSharedLogsViewer; 