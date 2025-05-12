import React, { useCallback, useMemo } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Calendar, GripHorizontal } from 'lucide-react';
import { RegimenDayType, IntensityLevel } from '@/types/regimen';
import { cn } from '@/lib/utils';

// Move color mapping outside component to prevent recreation
const intensityColors = {
  Easy: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    gradient: 'from-green-50 to-white',
    text: 'text-green-800',
    highlight: 'bg-green-100',
    buttonHover: 'hover:bg-green-100 hover:text-green-700',
    iconColor: 'text-green-500'
  },
  Medium: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    gradient: 'from-blue-50 to-white',
    text: 'text-blue-800',
    highlight: 'bg-blue-100',
    buttonHover: 'hover:bg-blue-100 hover:text-blue-700',
    iconColor: 'text-blue-500'
  },
  Hard: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    gradient: 'from-red-50 to-white',
    text: 'text-red-800',
    highlight: 'bg-red-100',
    buttonHover: 'hover:bg-red-100 hover:text-red-700',
    iconColor: 'text-red-500'
  },
  Rest: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    gradient: 'from-slate-50 to-white',
    text: 'text-slate-600',
    highlight: 'bg-slate-100',
    buttonHover: 'hover:bg-slate-100 hover:text-slate-700',
    iconColor: 'text-slate-500'
  }
};

// Default color for custom intensities
const defaultIntensityColor = {
  bg: 'bg-indigo-50',
  border: 'border-indigo-200',
  gradient: 'from-indigo-50 to-white',
  text: 'text-indigo-800',
  highlight: 'bg-indigo-100',
  buttonHover: 'hover:bg-indigo-100 hover:text-indigo-700',
  iconColor: 'text-indigo-500'
};

interface IntensityColumnProps {
  intensity: IntensityLevel;
  days: RegimenDayType[];
  onAddDay: (intensity: IntensityLevel) => void;
  onEditDay: (dayId: string) => void;
  onDeleteDay: (dayId: string) => void;
}

interface DayCardProps {
  day: RegimenDayType;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

// Optimize the day card to prevent unnecessary renders
const DayCard = React.memo(({ day, index, onEdit, onDelete }: DayCardProps) => {
  // Format date in a more readable way
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  }, []);

  // Ensure we always have a valid draggableId
  const draggableId = day.id || `day-${index}`;

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white p-3 rounded-md border border-slate-200 shadow-sm transition-all duration-200",
            snapshot.isDragging ? "shadow-lg ring-2 border-blue-200 opacity-90" : "",
            "hover:shadow-md transform hover:-translate-y-0.5"
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-slate-800">{day.name}</h3>
              <div className="text-sm text-slate-500 flex items-center mt-1">
                <Calendar className="h-3.5 w-3.5 mr-1 inline text-slate-400" />
                <span>{formatDate(day.date)}</span>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                onClick={onEdit}
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

function IntensityColumn({
  intensity,
  days,
  onAddDay,
  onEditDay,
  onDeleteDay
}: IntensityColumnProps) {
  // Get the appropriate colors for this intensity level - memoized
  const colors = useMemo(() => {
    return intensityColors[intensity as keyof typeof intensityColors] || defaultIntensityColor;
  }, [intensity]);

  // Memoize event handlers
  const handleAddDay = useCallback(() => {
    onAddDay(intensity);
  }, [onAddDay, intensity]);

  const handleEditDay = useCallback((dayId: string) => {
    onEditDay(dayId);
  }, [onEditDay]);

  const handleDeleteDay = useCallback((dayId: string) => {
    onDeleteDay(dayId);
  }, [onDeleteDay]);

  return (
    <div className="flex-1 min-w-[250px] max-w-[350px]">
      <Card 
        className={cn(
          "h-full flex flex-col border shadow-sm transition-all duration-200 will-change-transform",
          `${colors.border} bg-gradient-to-b ${colors.gradient}`,
          "hover:shadow-md"
        )}
      >
        <CardHeader className={`pb-3 border-b ${colors.border}`}>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <GripHorizontal className="h-4 w-4 mr-2 text-gray-500 cursor-move" />
              <span className={`font-semibold ${colors.text}`}>{intensity}</span>
              {days.length > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${colors.highlight} ${colors.text}`}>
                  {days.length}
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 w-8 p-0 ${colors.buttonHover}`} 
              onClick={handleAddDay}
            >
              <Plus className={`h-4 w-4 ${colors.iconColor}`} />
              <span className="sr-only">Add Day</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0 mt-2 overflow-hidden">
          <Droppable 
            droppableId={intensity}
            mode="standard" 
            isDropDisabled={false}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-3 min-h-[200px] transition-all duration-200 p-1",
                  snapshot.isDraggingOver ? `${colors.highlight} rounded-md p-2` : ""
                )}
                style={{
                  maxHeight: "calc(100vh - 250px)",
                  overflowY: "auto"
                }}
              >
                {days.map((day, index) => (
                  <DayCard 
                    key={day.id || `day-${index}`}
                    day={day}
                    index={index}
                    onEdit={() => handleEditDay(day.id)}
                    onDelete={() => handleDeleteDay(day.id)}
                  />
                ))}
                {provided.placeholder}
                {days.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 text-center" key="empty-state">
                    <p className="mb-1">No training days</p>
                    <p className="text-sm">Drag days here or click to add</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );
}

export default React.memo(IntensityColumn); 