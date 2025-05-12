import React, { useState, useEffect } from 'react';
import { Calendar, Check, Clock, Dumbbell, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { regimenService } from '@/services/api';

interface Regimen {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  sport?: string;
  level?: string;
  category?: string;
  days?: any[];
}

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sport?: string;
  level?: string;
}

interface AssignRegimenModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete?: Athlete;
  onSuccess?: (data: any) => void;
}

const AssignRegimenModal: React.FC<AssignRegimenModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSuccess,
}) => {
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [selectedRegimenId, setSelectedRegimenId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchRegimens();
    }
  }, [isOpen]);

  const fetchRegimens = async () => {
    setLoading(true);
    try {
      const data = await regimenService.getAllRegimens();
      setRegimens(data || []);
    } catch (error) {
      console.error('Error fetching regimens:', error);
      toast.error('Failed to load regimens. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!athlete || !selectedRegimenId) {
      toast.error('Please select a regimen to assign');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/regimens/' + selectedRegimenId + '/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId: athlete._id
        }),
        credentials: 'include'
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign regimen');
      }
      
      toast.success(data.message || 'Regimen assigned successfully');
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error assigning regimen:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign regimen. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryColor = (category: string = 'General') => {
    // Handle custom categories
    if (category.startsWith('Custom:')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    switch (category.toLowerCase()) {
      case 'strength':
        return 'bg-coach-primary/10 text-coach-primary';
      case 'endurance':
        return 'bg-coach-secondary/10 text-coach-secondary';
      case 'rehabilitation':
        return 'bg-coach-accent/10 text-coach-accent';
      case 'hypertrophy':
        return 'bg-purple-100 text-purple-800';
      case 'weight loss':
        return 'bg-green-100 text-green-800';
      case 'sport specific':
        return 'bg-blue-100 text-blue-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAthleteLabel = () => {
    if (!athlete) return 'No athlete selected';
    return `${athlete.firstName} ${athlete.lastName}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Training Program</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">Athlete</Label>
            <div className="mt-1 p-2 border rounded-md bg-muted">
              {getAthleteLabel()}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Select Training Program</Label>
            <Select
              value={selectedRegimenId}
              onValueChange={setSelectedRegimenId}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a regimen" />
              </SelectTrigger>
              <SelectContent>
                {regimens.map(regimen => (
                  <SelectItem key={regimen._id || regimen.id} value={regimen._id || regimen.id}>
                    {regimen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRegimenId && (
            <div className="border rounded-md p-3">
              {regimens
                .filter(r => (r._id || r.id) === selectedRegimenId)
                .map(regimen => (
                  <div key={regimen._id || regimen.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{regimen.name}</h3>
                      {regimen.category && (
                        <Badge className={getCategoryColor(regimen.category)}>
                          {regimen.category}
                        </Badge>
                      )}
                    </div>
                    
                    {regimen.description && (
                      <p className="text-sm text-gray-600">{regimen.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        <span>{formatDate(regimen.startDate)} - {formatDate(regimen.endDate)}</span>
                      </div>
                      
                      {regimen.sport && (
                        <div className="flex items-center">
                          <Dumbbell className="mr-1 h-3.5 w-3.5" />
                          <span>{regimen.sport}</span>
                        </div>
                      )}
                      
                      {regimen.level && (
                        <div className="flex items-center">
                          <Badge variant="outline" className="h-5 text-xs">
                            {regimen.level}
                          </Badge>
                        </div>
                      )}
                      
                      {regimen.days && (
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          <span>{regimen.days.length} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedRegimenId || isSubmitting}
            className="bg-coach-primary hover:bg-coach-primary/90"
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Assign Program
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRegimenModal; 