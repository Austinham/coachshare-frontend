
import React, { useState } from 'react';
import { Share2, Users, CalendarDays, Dumbbell, ExternalLink, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

const SharedRegimens: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('outgoing');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState<number | null>(null);

  // Mock data for shared regimens
  const outgoingShares = [
    {
      id: 1,
      regimenName: 'Pre-Season Basketball',
      sharedWith: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      date: '2023-11-20',
      status: 'active',
      category: 'Strength',
      exercises: 12
    },
    {
      id: 2,
      regimenName: 'Marathon Training Plan',
      sharedWith: {
        name: 'Michael Chen',
        email: 'michael@example.com',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      date: '2023-10-15',
      status: 'pending',
      category: 'Endurance',
      exercises: 24
    },
    {
      id: 3,
      regimenName: 'Youth Football Development',
      sharedWith: {
        name: 'James Wilson',
        email: 'james@example.com',
        avatar: 'https://i.pravatar.cc/150?img=3'
      },
      date: '2023-11-10',
      status: 'active',
      category: 'Strength',
      exercises: 18
    },
    {
      id: 4,
      regimenName: 'Swimming Sprint Program',
      sharedWith: {
        name: 'Emily Rodriguez',
        email: 'emily@example.com',
        avatar: 'https://i.pravatar.cc/150?img=4'
      },
      date: '2023-12-01',
      status: 'expired',
      category: 'Endurance',
      exercises: 15
    }
  ];

  const incomingShares = [
    {
      id: 101,
      regimenName: 'Advanced HIIT Workout',
      sharedBy: {
        name: 'Robert Smith',
        email: 'robert@example.com',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      date: '2023-11-25',
      status: 'active',
      category: 'HIIT',
      exercises: 10
    },
    {
      id: 102,
      regimenName: 'Volleyball Off-Season',
      sharedBy: {
        name: 'Olivia Taylor',
        email: 'olivia@example.com',
        avatar: 'https://i.pravatar.cc/150?img=6'
      },
      date: '2023-10-30',
      status: 'active',
      category: 'Sport-specific',
      exercises: 22
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return 'bg-coach-primary/10 text-coach-primary';
      case 'endurance':
        return 'bg-coach-secondary/10 text-coach-secondary';
      case 'hiit':
        return 'bg-blue-500/10 text-blue-500';
      case 'sport-specific':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'expired':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteShare = () => {
    console.log('Deleting share with ID:', selectedShare);
    setDeleteDialogOpen(false);
    setSelectedShare(null);
  };

  const confirmDelete = (id: number) => {
    setSelectedShare(id);
    setDeleteDialogOpen(true);
  };

  const filteredOutgoingShares = outgoingShares.filter(share => {
    return (
      (share.regimenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       share.sharedWith.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterBy === 'all' || share.status.toLowerCase() === filterBy)
    );
  });

  const filteredIncomingShares = incomingShares.filter(share => {
    return (
      (share.regimenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       share.sharedBy.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterBy === 'all' || share.status.toLowerCase() === filterBy)
    );
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shared Regimens</h1>
          <p className="text-gray-500 mt-1">Manage regimens you've shared and those shared with you</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="outgoing" className="flex items-center">
            <Share2 className="mr-2 h-4 w-4" />
            Shared by Me
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Shared with Me
          </TabsTrigger>
        </TabsList>
        
        <Card className="mt-4 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search by regimen or person..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex gap-2">
                <Filter size={18} />
                <span className="hidden md:inline">More Filters</span>
              </Button>
            </div>
          </div>
        </Card>

        <TabsContent value="outgoing">
          {filteredOutgoingShares.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regimen</TableHead>
                    <TableHead>Shared With</TableHead>
                    <TableHead>Date Shared</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOutgoingShares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{share.regimenName}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(share.category)}>{share.category}</Badge>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Dumbbell className="h-3 w-3 mr-1" />
                              {share.exercises} exercises
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={share.sharedWith.avatar} alt={share.sharedWith.name} />
                            <AvatarFallback>{share.sharedWith.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{share.sharedWith.name}</div>
                            <div className="text-xs text-gray-500">{share.sharedWith.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(share.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(share.status)}>
                          {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => confirmDelete(share.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardContent>
                <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No shared regimens found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterBy !== 'all' 
                    ? "Try adjusting your search or filter criteria" 
                    : "You haven't shared any regimens yet"}
                </p>
                {!searchTerm && filterBy === 'all' && (
                  <Button>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share a Regimen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="incoming">
          {filteredIncomingShares.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIncomingShares.map((share) => (
                <Card key={share.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{share.regimenName}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          <span>Shared on {format(new Date(share.date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(share.status)}>
                        {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={getCategoryColor(share.category)}>
                        {share.category}
                      </Badge>
                      <div className="flex items-center text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-1">
                        <Dumbbell className="h-3 w-3 mr-1" />
                        {share.exercises} exercises
                      </div>
                    </div>
                    
                    <div className="flex items-center border-t pt-4 mt-4">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={share.sharedBy.avatar} alt={share.sharedBy.name} />
                        <AvatarFallback>{share.sharedBy.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">Shared by {share.sharedBy.name}</div>
                        <div className="text-xs text-gray-500">{share.sharedBy.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex justify-between">
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => confirmDelete(share.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button variant="outline" size="sm">
                      View Regimen
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardContent>
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No regimens shared with you</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterBy !== 'all' 
                    ? "Try adjusting your search or filter criteria" 
                    : "You don't have any regimens shared with you yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this shared regimen? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShare}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedRegimens;
