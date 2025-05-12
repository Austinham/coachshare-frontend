
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash, CalendarIcon, Plus, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { ExerciseBlockType, TrainingPeriodType } from '@/types/regimen';
import ExerciseBlock from './ExerciseBlock';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

interface TrainingDayProps {
  id: string;
  index: number;
  date: string;
  name: string;
  exercises: ExerciseBlockType[];
  period?: TrainingPeriodType;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
  onExerciseUpdate: (dayId: string, exerciseId: string, data: Partial<Omit<ExerciseBlockType, 'id'>>) => void;
  onExerciseDelete: (dayId: string, exerciseId: string) => void;
  onExerciseDuplicate: (dayId: string, exerciseId: string) => void;
  onExerciseReorder: (dayId: string, sourceIndex: number, destinationIndex: number) => void;
  onAddExercise: (dayId: string) => void;
  onPeriodChange?: (dayId: string, period: TrainingPeriodType | undefined) => void;
}

const TrainingDay: React.FC<TrainingDayProps> = ({
  id,
  index,
  date,
  name,
  exercises,
  period,
  onMoveUp,
  onMoveDown,
  onDelete,
  onExerciseUpdate,
  onExerciseDelete,
  onExerciseDuplicate,
  onExerciseReorder,
  onAddExercise,
  onPeriodChange
}) => {
  const [multipleExerciseCount, setMultipleExerciseCount] = useState(2);
  const [isOpen, setIsOpen] = useState(true);
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    onExerciseReorder(id, result.source.index, result.destination.index);
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const handleAddMultipleExercises = () => {
    // Add the specified number of exercises
    for (let i = 0; i < multipleExerciseCount; i++) {
      onAddExercise(id);
    }
  };

  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      const newPeriod = value as TrainingPeriodType;
      onPeriodChange(id, newPeriod === period ? undefined : newPeriod);
    }
  };

  const getPeriodBadgeVariant = (currentPeriod?: TrainingPeriodType) => {
    switch (currentPeriod) {
      case 'easy': return 'outline';
      case 'medium': return 'secondary';
      case 'hard': return 'destructive';
      case 'rest': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)}
            className="mr-2 h-8 w-8 p-0"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-medium">Day {index + 1}: {name}</CardTitle>
              {period && (
                <Badge variant={getPeriodBadgeVariant(period)}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon size={14} className="mr-1" />
              {formattedDate}
              <span className="ml-2">({exercises.length} exercises)</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="h-8 w-8 p-0"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(index)}
            className="h-8 w-8 p-0"
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Training Period:</p>
              <ToggleGroup 
                type="single" 
                value={period} 
                onValueChange={handlePeriodChange}
                className="justify-start"
              >
                <ToggleGroupItem value="easy" aria-label="Easy period" className="bg-green-50 data-[state=on]:bg-green-100 data-[state=on]:text-green-900 border-green-200 data-[state=on]:border-green-500">
                  Easy
                </ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium period" className="bg-blue-50 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900 border-blue-200 data-[state=on]:border-blue-500">
                  Medium
                </ToggleGroupItem>
                <ToggleGroupItem value="hard" aria-label="Hard period" className="bg-red-50 data-[state=on]:bg-red-100 data-[state=on]:text-red-900 border-red-200 data-[state=on]:border-red-500">
                  Hard
                </ToggleGroupItem>
                <ToggleGroupItem value="rest" aria-label="Rest period" className="bg-gray-50 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 border-gray-200 data-[state=on]:border-gray-500">
                  Rest
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={`day-${id}`}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {exercises.map((exercise, idx) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ExerciseBlock
                              id={exercise.id}
                              index={idx}
                              name={exercise.name}
                              sets={exercise.sets}
                              isReps={exercise.isReps}
                              reps={exercise.reps}
                              duration={exercise.duration}
                              restInterval={exercise.restInterval}
                              notes={exercise.notes}
                              mediaLinks={exercise.mediaLinks}
                              onUpdate={(exerciseId, data) => onExerciseUpdate(id, exerciseId, data)}
                              onDelete={(exerciseId) => onExerciseDelete(id, exerciseId)}
                              onDuplicate={(exerciseId) => onExerciseDuplicate(id, exerciseId)}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onAddExercise(id)}
              >
                Add Exercise
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Multiple
                    <ChevronDown size={14} className="ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Add Multiple Exercises</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="2"
                        max="10"
                        value={multipleExerciseCount}
                        onChange={(e) => setMultipleExerciseCount(parseInt(e.target.value) || 2)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">exercises</span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAddMultipleExercises}
                    >
                      Add Exercises
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TrainingDay;
