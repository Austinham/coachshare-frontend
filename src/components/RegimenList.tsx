<<<<<<< HEAD
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Filter, Plus, Search, Share2, Loader2, X, CalendarIcon, Users } from 'lucide-react';
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Filter, Plus, Search, Share2 } from 'lucide-react';
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
<<<<<<< HEAD
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format, parseISO, isAfter, isBefore, isValid } from 'date-fns';
import { debounce } from '@/utils/debounce';
import ShareRegimenDialog from '@/components/ShareRegimenDialog';
import { regimenService } from '@/services/api';
import RegimenCard from '@/components/regimen/RegimenCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RegimenType } from '@/types/regimen';

interface RegimenItem {
  id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Additional frontend properties
  level?: string;
  sport?: string;
  athletes?: number;
  exercises?: number;
  favorite?: boolean;
}

const RegimenList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [regimens, setRegimens] = useState<RegimenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'upcoming' | 'past' | 'custom'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Update active filters count - memoized to avoid recalculation
  const updateActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (levelFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (showOnlyFavorites) count++;
    setActiveFiltersCount(count);
  }, [levelFilter, dateRangeFilter, showOnlyFavorites]);
  
  useEffect(() => {
    updateActiveFiltersCount();
  }, [levelFilter, dateRangeFilter, showOnlyFavorites, updateActiveFiltersCount]);
  
  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );
  
  // Fetch regimens from the API - memoized with useCallback
  useEffect(() => {
    const fetchRegimens = async () => {
      setLoading(true);
      try {
        // Use regimenService to get data - filtered server-side by user role
        const data = await regimenService.getAllRegimens();
        console.log('RegimenList: received regimens:', data.length);
        setRegimens(data);
      } catch (error) {
        console.error('Error fetching regimens:', error);
        toast({
          title: 'Error',
          description: 'Failed to load regimens',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRegimens();
  }, []);
  
  // Filter regimens based on all criteria - memoized with useMemo
  const filteredRegimens = useMemo(() => {
    console.log('Filtering regimens:', regimens);
    
    if (!Array.isArray(regimens)) {
      console.log('Regimens is not an array:', regimens);
      return [];
    }
    
    return regimens.filter(regimen => {
      if (!regimen || typeof regimen !== 'object') {
        console.log('Invalid regimen object:', regimen);
        return false;
      }
      
      // Filter by search term
      const nameMatch = regimen.name
        ? regimen.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      
      if (!nameMatch) return false;
      
      // Filter by level
      const levelMatch = levelFilter === 'all' || regimen.level === levelFilter;
      if (!levelMatch) return false;
      
      // Filter by favorites
      const favoriteMatch = !showOnlyFavorites || regimen.favorite;
      if (!favoriteMatch) return false;
      
      // Filter by date range
      if (dateRangeFilter !== 'all') {
        const today = new Date();
        const startDate = regimen.startDate ? parseISO(regimen.startDate) : null;
        const endDate = regimen.endDate ? parseISO(regimen.endDate) : null;
        
        if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
          console.log('Invalid dates for regimen:', regimen.id);
          return false;
        }
        
        if (dateRangeFilter === 'upcoming' && !isAfter(endDate, today)) {
          return false;
        } else if (dateRangeFilter === 'past' && !isBefore(endDate, today)) {
          return false;
        } else if (dateRangeFilter === 'custom') {
          const filterStart = startDateFilter ? parseISO(startDateFilter) : null;
          const filterEnd = endDateFilter ? parseISO(endDateFilter) : null;
          
          if (filterStart && isValid(filterStart) && isBefore(endDate, filterStart)) {
            return false;
          }
          
          if (filterEnd && isValid(filterEnd) && isAfter(startDate, filterEnd)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [regimens, searchTerm, levelFilter, showOnlyFavorites, dateRangeFilter, startDateFilter, endDateFilter]);

  // Memoize color calculations to avoid recalculation on each render
  const getCategoryColor = useCallback((category: string) => {
    // Handle custom categories
    if (category && category.startsWith('Custom:')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    switch (category && category.toLowerCase()) {
=======

const RegimenList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  
  // Mock data for regimens
  const regimens = [
    {
      id: 1,
      name: 'Pre-Season Basketball',
      description: 'Strength and conditioning program for basketball players preparing for the season.',
      category: 'Strength',
      level: 'Intermediate',
      sport: 'Basketball',
      athletes: 6,
      exercises: 18,
      date: '2023-11-15'
    },
    {
      id: 2,
      name: 'Marathon Training Plan',
      description: 'Progressive endurance training for marathon runners, includes tempo runs and long-distance training.',
      category: 'Endurance',
      level: 'Advanced',
      sport: 'Running',
      athletes: 12,
      exercises: 24,
      date: '2023-10-28'
    },
    {
      id: 3,
      name: 'Post-Injury Recovery',
      description: 'Gradual rehabilitation program focusing on mobility and gentle strengthening.',
      category: 'Recovery',
      level: 'Beginner',
      sport: 'Multiple',
      athletes: 3,
      exercises: 15,
      date: '2023-11-03'
    },
    {
      id: 4,
      name: 'Youth Football Development',
      description: 'Fundamental skills and conditioning for young football players.',
      category: 'Strength',
      level: 'Beginner',
      sport: 'Football',
      athletes: 15,
      exercises: 20,
      date: '2023-11-10'
    },
    {
      id: 5,
      name: 'Swimming Sprint Program',
      description: 'High-intensity training for competitive swimmers focusing on sprint events.',
      category: 'Endurance',
      level: 'Advanced',
      sport: 'Swimming',
      athletes: 8,
      exercises: 22,
      date: '2023-10-15'
    }
  ];

  // Filter regimens based on search term and category
  const filteredRegimens = regimens.filter(regimen => {
    return (
      regimen.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (category === 'all' || regimen.category.toLowerCase() === category)
    );
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
      case 'strength':
        return 'bg-coach-primary/10 text-coach-primary';
      case 'endurance':
        return 'bg-coach-secondary/10 text-coach-secondary';
<<<<<<< HEAD
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
  }, []);

  // Memoize getDisplayCategory
  const getDisplayCategory = useCallback((category: string) => {
    return category && category.startsWith('Custom:') ? category.substring(7) : category;
  }, []);
  
  // More efficient reset filters with useCallback
  const resetFilters = useCallback(() => {
    setLevelFilter('all');
    setDateRangeFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setShowOnlyFavorites(false);
    setFiltersOpen(false);
  }, []);
  
  // Helper function to check if a date is recent (within the last 7 days)
  const isRecent = useCallback((dateString: string | undefined) => {
    if (!dateString) return false;
    
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 7;
    } catch (error) {
      console.error('Error parsing date:', error);
      return false;
    }
  }, []);
  
  // Handle click on regimen card
  const handleRegimenClick = useCallback((id: string) => {
    navigate(`/app/regimens/create?id=${id}`);
  }, [navigate]);
=======
      case 'recovery':
        return 'bg-coach-accent/10 text-coach-accent';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Training Regimens</h1>
          <p className="text-gray-500 mt-1">Create, manage, and share your training plans</p>
        </div>
        <Button 
          className="mt-4 md:mt-0 bg-coach-primary hover:bg-coach-primary/90"
          onClick={() => navigate('/app/regimens/create')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Regimen
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search regimens..." 
              className="pl-10" 
<<<<<<< HEAD
              onChange={(e) => debouncedSearch(e.target.value)}
=======
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
            />
          </div>
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
<<<<<<< HEAD
                <SelectItem value="Strength & Conditioning">Strength & Conditioning</SelectItem>
                <SelectItem value="Endurance">Endurance</SelectItem>
                <SelectItem value="Flexibility & Mobility">Flexibility & Mobility</SelectItem>
                <SelectItem value="Sport Specific">Sport Specific</SelectItem>
                <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                <SelectItem value="General Fitness">General Fitness</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-coach-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Filter Regimens</h3>
                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-gray-400" 
                        onClick={resetFilters}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Level</label>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date Range</label>
                    <Select value={dateRangeFilter} onValueChange={(value: string) => setDateRangeFilter(value as 'all' | 'upcoming' | 'past' | 'custom')}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {dateRangeFilter === 'custom' && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                          <Input 
                            type="date" 
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                          <Input 
                            type="date" 
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="favorites" 
                      checked={showOnlyFavorites}
                      onCheckedChange={(checked) => setShowOnlyFavorites(checked === true)}
                    />
                    <Label htmlFor="favorites">Show only favorites</Label>
                  </div>
                  
                  <div className="pt-2 border-t flex justify-end">
                    <Button 
                      onClick={() => setFiltersOpen(false)} 
                      className="bg-coach-primary hover:bg-coach-primary/90"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
=======
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex gap-2">
              <Filter size={18} />
              <span className="hidden md:inline">More Filters</span>
            </Button>
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
          </div>
        </div>
      </Card>

<<<<<<< HEAD
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-coach-primary" />
          <span className="ml-2 text-lg">Loading regimens...</span>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegimens.map((regimen) => (
          <RegimenCard 
            key={regimen.id}
            regimen={regimen}
            onRegimenClick={handleRegimenClick}
          />
=======
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRegimens.map((regimen) => (
          <div 
            key={regimen.id} 
            className={`regimen-card regimen-card-${regimen.category.toLowerCase()} cursor-pointer`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{regimen.name}</h3>
              <Badge className={getCategoryColor(regimen.category)}>
                {regimen.category}
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{regimen.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{regimen.sport}</Badge>
              <Badge variant="outline">{regimen.level}</Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Dumbbell size={14} className="mr-1" />
                <span>{regimen.exercises} exercises</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Sharing regimen: ${regimen.id}`);
                  }}
                >
                  <Share2 size={14} />
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-coach-primary hover:bg-coach-primary/90"
                  onClick={() => {
                    console.log(`Viewing regimen: ${regimen.id}`);
                    navigate(`/app/regimens/create?id=${regimen.id}`);
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
        ))}
      </div>

      {filteredRegimens.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No regimens found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
<<<<<<< HEAD
          )}
        </>
=======
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
      )}
    </div>
  );
};

<<<<<<< HEAD
export default React.memo(RegimenList);
=======
export default RegimenList;
>>>>>>> 21e1a0f199201fad909883d9baceea1f1b4ad3cf
