import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, UserPlus, Mail, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InviteAthleteModal from './InviteAthleteModal';
import EditAthleteModal from './EditAthleteModal';
import AssignRegimenModal from './AssignRegimenModal';
import AssignRegimenBulkModal from './AssignRegimenBulkModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sport?: string;
  level?: string;
  regimens?: any[];
  lastActive?: string;
}

const AthleteList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignRegimenModalOpen, setIsAssignRegimenModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/athletes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch athletes' }));
        throw new Error(errorData.message || 'Failed to fetch athletes');
      }
      
      const data = await response.json();
      setAthletes(data.data.athletes || []);
    } catch (error) {
      console.error('Error fetching athletes:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(athlete => {
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
    return (
      (fullName.includes(searchTerm.toLowerCase()) || 
       athlete.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (sportFilter === 'all' || (athlete.sport && athlete.sport.toLowerCase() === sportFilter.toLowerCase()))
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleInviteSuccess = (data: any) => {
    const newAthlete = data.athlete;
    setAthletes(prev => [...prev, {
      _id: newAthlete.id,
      firstName: newAthlete.firstName,
      lastName: newAthlete.lastName,
      email: newAthlete.email,
      regimens: newAthlete.regimens || []
    }]);
    toast.success('Athlete invited successfully!');
  };

  const handleEditClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsEditModalOpen(true);
  };

  const handleAssignRegimenClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsAssignRegimenModalOpen(true);
  };
  
  const handleOpenBulkAssignModal = () => {
    setIsBulkAssignModalOpen(true);
  };

  const handleEditSuccess = (updatedAthlete: Athlete) => {
    setAthletes(prev => 
      prev.map(athlete => 
        athlete._id === updatedAthlete._id ? updatedAthlete : athlete
      )
    );
    toast.success('Athlete details updated.');
  };

  const handleAssignRegimenSuccess = () => {
    fetchAthletes();
    toast.success(`Successfully assigned program to ${selectedAthlete?.firstName} ${selectedAthlete?.lastName}`);
  };
  
  const handleBulkAssignSuccess = () => {
    fetchAthletes();
    toast.success('Programs assigned in bulk successfully.');
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!confirm('Are you sure you want to remove this athlete from your team? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/auth/remove-athlete/${athleteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to remove athlete' }));
        throw new Error(errorData.message || 'Failed to remove athlete');
      }
      
      const data = await response.json();
      setAthletes(prev => prev.filter(athlete => athlete._id !== athleteId));
      toast.success(data.message || 'Athlete removed successfully');
    } catch (error) {
      console.error('Error removing athlete:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred while removing athlete');
    }
  };
  
  const handleMessageAthlete = (athleteId: string, athleteName: string) => {
    navigate(`/app/messages/${athleteId}`, { state: { recipientName: athleteName } });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading athletes...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Athletes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenBulkAssignModal} className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> Assign Program to Multiple
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} className="flex items-center">
            <UserPlus className="mr-2 h-4 w-4" /> Invite Athlete
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              <SelectItem value="basketball">Basketball</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="swimming">Swimming</SelectItem>
              <SelectItem value="football">Football</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="hidden md:flex">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      {filteredAthletes.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-gray-500">No athletes found. Try adjusting your search or filters, or invite a new athlete.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAthletes.map(athlete => (
          <Card key={athlete._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="flex items-center mb-3">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarFallback>{getInitials(athlete.firstName, athlete.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{`${athlete.firstName} ${athlete.lastName}`}</h3>
                  <p className="text-sm text-gray-500 truncate">{athlete.email}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm mb-3">
                {athlete.sport && <p><strong>Sport:</strong> {athlete.sport}</p>}
                {athlete.level && <p><strong>Level:</strong> {athlete.level}</p>}
                <p><strong>Active Programs:</strong> {athlete.regimens?.length || 0}</p>
                {athlete.lastActive && <p><strong>Last Active:</strong> {athlete.lastActive}</p>}
              </div>
              <div className="flex justify-end space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Actions</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(athlete)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAssignRegimenClick(athlete)}>
                      <Plus className="mr-2 h-4 w-4" /> Assign Program
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMessageAthlete(athlete._id, `${athlete.firstName} ${athlete.lastName}`)}>
                      <Mail className="mr-2 h-4 w-4" /> Message Athlete
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRemoveAthlete(athlete._id)}
                      className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
                    >
                      Remove Athlete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <InviteAthleteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={handleInviteSuccess}
      />
      {selectedAthlete && (
        <>
          <EditAthleteModal 
            isOpen={isEditModalOpen} 
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedAthlete(null);
            }} 
            athlete={selectedAthlete} 
            onSuccess={handleEditSuccess}
          />
          <AssignRegimenModal 
            isOpen={isAssignRegimenModalOpen}
            onClose={() => {
              setIsAssignRegimenModalOpen(false);
              setSelectedAthlete(null);
            }}
            athlete={selectedAthlete}
            onSuccess={handleAssignRegimenSuccess}
          />
        </>
      )}
      <AssignRegimenBulkModal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        athletes={athletes}
        onSuccess={handleBulkAssignSuccess}
      />
    </div>
  );
};

export default AthleteList;
