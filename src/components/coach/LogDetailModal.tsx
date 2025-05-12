// src/components/coach/LogDetailModal.tsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { WorkoutLog, ExerciseLog } from '@/types/workoutLog'; // Assuming types are defined here

interface LogDetailModalProps {
    log: WorkoutLog | null;
    isOpen: boolean;
    onClose: () => void;
}

// Helper function to format duration (if needed, or import from utils)
const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, isOpen, onClose }) => {
    if (!log) return null;

    // Helper function to get athlete name safely
    const getAthleteName = (log: WorkoutLog): string => {
        if (typeof log.athleteId === 'object' && log.athleteId?.firstName) {
            return `${log.athleteId.firstName} ${log.athleteId.lastName || ''}`.trim();
        }
        return log.athleteName || 'Athlete';
    };

    // Helper function to get difficulty color
    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-800';
            case 'Medium': return 'bg-blue-100 text-blue-800';
            case 'Hard': return 'bg-orange-100 text-orange-800';
            case 'Very Hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Workout Log Details</DialogTitle>
                    <DialogDescription>
                        {log.completedAt ? format(new Date(log.completedAt), 'EEEE, MMMM d, yyyy') : 'N/A'} • {getAthleteName(log)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <h3 className="text-sm font-medium text-gray-500">Workout</h3>
                                <p className="font-semibold mt-1">{log.dayName || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{log.regimenName || 'N/A'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <h3 className="text-sm font-medium text-gray-500">Rating & Difficulty</h3>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    {log.rating ? (
                                        <>
                                            <div className={`h-3 w-3 rounded-full ${log.rating <= 2 ? 'bg-green-500' : log.rating <= 4 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                            <p className="font-semibold">{log.rating}/5</p>
                                        </>
                                    ) : (
                                        <p className="font-semibold">N/A</p>
                                    )}
                                </div>
                                {log.difficulty && (
                                     <Badge className={`mt-1 ${getDifficultyColor(log.difficulty)}`}>
                                         {log.difficulty}
                                     </Badge>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                                <p className="font-semibold mt-1">{log.duration ? formatDuration(log.duration) : 'N/A'}</p>
                                <p className="text-xs text-gray-500">
                                    {log.completedAt ? format(new Date(log.completedAt), 'h:mm a') : 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Athlete Notes */}
                    {log.notes && (
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Athlete Notes</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{log.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Exercise Details Table */}
                    <div>
                        <h3 className="text-sm font-medium mb-2">Exercise Details</h3>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Exercise</TableHead>
                                        <TableHead className="text-center">Sets</TableHead>
                                        <TableHead className="text-center">Target Reps</TableHead>
                                        <TableHead className="text-center">Actual Reps</TableHead>
                                        <TableHead className="text-center">Weight</TableHead>
                                        <TableHead>Exercise Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {log.exercises && log.exercises.length > 0 ? (
                                        log.exercises.map((exercise: ExerciseLog, index: number) => (
                                            <TableRow key={exercise._id || `ex-${index}`}>
                                                <TableCell className="font-medium">
                                                    {exercise.exerciseName || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-center">{exercise.sets ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{exercise.targetReps ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">{exercise.actualReps ?? 'N/A'}</TableCell>
                                                <TableCell className="text-center">
                                                    {exercise.weight || '-'}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {exercise.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500">No exercise data available.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {/* Add other actions if needed, e.g., Export */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LogDetailModal; 