import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sport?: string;
  level?: string;
}

interface EditAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete | null;
  onSuccess?: (updatedAthlete: Athlete) => void;
}

const SPORTS = ['Basketball', 'Football', 'Running', 'Swimming', 'Tennis', 'Volleyball', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

const EditAthleteModal: React.FC<EditAthleteModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Partial<Athlete>>({
    sport: '',
    level: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (athlete) {
      setFormData({
        sport: athlete.sport || '',
        level: athlete.level || ''
      });
    }
  }, [athlete]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!athlete) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/auth/update-athlete/${athlete._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update athlete');
      }
      
      toast.success(`Successfully updated ${athlete.firstName}'s profile!`);
      
      if (onSuccess) {
        onSuccess({
          ...athlete,
          ...formData
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating athlete:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while updating the athlete');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 h-5 w-5 text-coach-primary" />
            Edit Athlete Details
          </DialogTitle>
          <DialogDescription>
            {athlete ? `Update details for ${athlete.firstName} ${athlete.lastName}` : 'Update athlete details'}
          </DialogDescription>
        </DialogHeader>
        
        {athlete && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sport" className="text-right">
                  Sport
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.sport}
                    onValueChange={(value) => handleChange('sport', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleChange('level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-coach-primary hover:bg-coach-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAthleteModal; 