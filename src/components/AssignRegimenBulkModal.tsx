import React, { useState, useEffect } from 'react';
import { Calendar, Check, Clock, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface Regimen {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignRegimenBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  onSuccess?: (data: any) => void;
}

const AssignRegimenBulkModal: React.FC<AssignRegimenBulkModalProps> = ({
  isOpen,
  onClose,
  athletes,
  onSuccess,
}) => {
  const [allRegimens, setAllRegimens] = useState<Regimen[]>([]);
  const [selectedRegimenId, setSelectedRegimenId] = useState<string>('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [loadingRegimens, setLoadingRegimens] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchRegimens();
      setSelectedAthleteIds(new Set());
      setSelectedRegimenId('');
    }
  }, [isOpen]);

  const fetchRegimens = async () => {
    setLoadingRegimens(true);
    try {
      console.log('Fetching regimens...');
      const response = await fetch('http://localhost:8000/api/regimens/coach', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch regimens');
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      // Check if data exists and has the expected structure
      if (!data || !data.data || !data.data.regimens) {
        console.error('Invalid data structure received from API:', data);
        setAllRegimens([]);
        return;
      }

      // Extract the regimens array from the nested structure
      const regimens = data.data.regimens;
      console.log('Extracted regimens:', regimens);
      
      // Ensure each regimen has the required fields
      const validRegimens = regimens.filter(regimen => {
        const isValid = regimen && (regimen._id || regimen.id) && regimen.name;
        if (!isValid) {
          console.warn('Invalid regimen found:', regimen);
        }
        return isValid;
      });

      console.log('Valid regimens:', validRegimens);
      setAllRegimens(validRegimens);
    } catch (error) {
      console.error('Error fetching regimens:', error);
      toast.error('Failed to load regimens. Please try again later.');
      setAllRegimens([]);
    } finally {
      setLoadingRegimens(false);
    }
  };

  const handleCheckboxChange = (athleteId: string) => {
    setSelectedAthleteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId);
      } else {
        newSet.add(athleteId);
      }
      return newSet;
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  const handleSubmit = async () => {
    if (!selectedRegimenId || selectedAthleteIds.size === 0) {
      toast.error('Please select a program AND at least one athlete.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/assign-regimen-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regimenId: selectedRegimenId,
          athleteIds: Array.from(selectedAthleteIds)
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
      console.error('Error assigning regimen in bulk:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign regimen. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRegimenDetails = Array.isArray(allRegimens) 
    ? allRegimens.find(r => (r._id || r.id) === selectedRegimenId)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Assign Program to Multiple Athletes</DialogTitle>
          <DialogDescription id="assign-bulk-description">
            Select the athletes you want to assign this regimen to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="regimen-select" className="text-sm font-medium">Select Training Program</Label>
            <Select
              value={selectedRegimenId}
              onValueChange={setSelectedRegimenId}
              disabled={loadingRegimens}
            >
              <SelectTrigger id="regimen-select" className="mt-1">
                <SelectValue placeholder={loadingRegimens ? "Loading regimens..." : "Select a program"} />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  console.log('Rendering regimens:', allRegimens);
                  return allRegimens.length === 0 ? (
                    <SelectItem value="none" disabled>No programs available</SelectItem>
                  ) : (
                    allRegimens.map(regimen => (
                      <SelectItem key={regimen._id || regimen.id} value={regimen._id || regimen.id}>
                        {regimen.name}
                      </SelectItem>
                    ))
                  );
                })()}
              </SelectContent>
            </Select>
            {selectedRegimenDetails && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatDate(selectedRegimenDetails.startDate)} - {formatDate(selectedRegimenDetails.endDate)}</span>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Select Athletes</Label>
            <ScrollArea className="h-[250px] w-full rounded-md border p-3 mt-1">
              {athletes.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">No athletes found.</div>
              ) : (
                <div className="space-y-3">
                  {athletes.map((athlete) => (
                    <div key={athlete._id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                      <Checkbox
                        id={`athlete-${athlete._id}`}
                        checked={selectedAthleteIds.has(athlete._id)}
                        onCheckedChange={() => handleCheckboxChange(athlete._id)}
                        disabled={!selectedRegimenId}
                      />
                      <Label 
                        htmlFor={`athlete-${athlete._id}`} 
                        className={`flex items-center cursor-pointer flex-1 ${!selectedRegimenId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback className="bg-coach-primary text-white text-xs">
                            {getInitials(athlete.firstName, athlete.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{`${athlete.firstName} ${athlete.lastName}`}</span>
                          <span className="text-xs text-muted-foreground">{athlete.email}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="text-right text-sm mt-2 text-muted-foreground">
              {selectedAthleteIds.size} athlete(s) selected
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedRegimenId || selectedAthleteIds.size === 0 || isSubmitting}
            className="bg-coach-primary hover:bg-coach-primary/90"
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Assign Program
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRegimenBulkModal; 